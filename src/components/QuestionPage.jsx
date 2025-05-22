import React, { useState, useEffect } from "react";

function fetchQuestionsFromBackend() {
  return fetch("https://ass-server-4qwz.onrender.com/api/questions")
    .then((response) => response.json())
    .catch((error) => {
      console.error("Error fetching questions:", error);
      throw error;
    });
}

const QuestionPage = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [visited, setVisited] = useState({});
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [submitted, setSubmitted] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        const data = await fetchQuestionsFromBackend();
        setQuestions(data);
        setError(null);
      } catch (err) {
        setError("Failed to load questions. Please try again later.");
        console.error("Error loading questions:", err);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, []);

  useEffect(() => {
    if (!submitted && testStarted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [submitted, testStarted]);

  useEffect(() => {
    console.log(questions);
  }, [questions]);

  const handleStartTest = () => {
    setTestStarted(true);
  };

  const handleOptionChange = (qid, value) => {
    setSelectedAnswers({ ...selectedAnswers, [qid]: value });
    setQuestions((prevQuestions) => {
      return prevQuestions.map((question) =>
        question.id === qid
          ? { ...question, status: "ANSWERED", selectedAnswers: value }
          : question
      );
    });
  };

  const handleNext = () => {
    const qid = questions[currentQIndex]?.id;
    if (qid) {
      setVisited({ ...visited, [qid]: true });
      if (!selectedAnswers[qid]) {
        setQuestions((prevQuestions) => {
          return prevQuestions.map((question) =>
            question.id === qid && question.status === "NOT_ATTEMPTED"
              ? { ...question, status: "NOT_ANSWERED" }
              : question
          );
        });
      }
    }
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(currentQIndex - 1);
    }
  };

  const handleReview = () => {
    const currentQId = questions[currentQIndex]?.id;
    if (currentQId) {
      setQuestions((prevQuestions) => {
        return prevQuestions.map((question) =>
          question.id === currentQId
            ? { ...question, status: "REVIEW" }
            : question
        );
      });
    }
  };

  const handleJump = (index) => {
    const qid = questions[index]?.id;
    if (qid) setVisited({ ...visited, [qid]: true });
    setCurrentQIndex(index);
  };

  const calculateScore = () => {
    let correctAnswers = 0;
    questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctAnswers++;
      }
    });
    return {
      correct: correctAnswers,
      total: questions.length,
      percentage: Math.round((correctAnswers / questions.length) * 100),
    };
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const result = calculateScore();
    setScore(result);

    fetch("https://ass-server-4qwz.onrender.com/api/submit-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ questions }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Test results saved:", data);
      })
      .catch((error) => {
        console.error("Error saving test results:", error);
      });
  };

  const formatTime = () => {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  const getColor = (qid) => {
    const question = questions.find((q) => q.id === qid);
    if (!question) return "red";

    if (qid === questions[currentQIndex]?.id) return "blue";
    if (question.status === "REVIEW") return "gray";
    if (question.status === "ANSWERED") return "green";
    if (question.status === "NOT_ANSWERED") return "yellow";
    return "red";
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return "EXCELLENT";
    if (percentage >= 75) return "VERY GOOD";
    if (percentage >= 60) return "GOOD";
    return "NEEDS IMPROVEMENT";
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "rgba(245, 245, 245, 1)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            backgroundColor: "white",
            borderRadius: "10px",
            gap: "10px",
          }}
        >
          <h2>Loading Questions...</h2>
          <p>Please wait while we prepare your test.</p>
          <p style={{ color: "red" }}>
            Server running on free tier, so it may take some time to load
            questions.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "rgba(245, 245, 245, 1)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            backgroundColor: "white",
            borderRadius: "10px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            color: "red",
          }}
        >
          <h2>Error</h2>
          <p style={{ color: "red" }}>
            Server is running on free tier, so it may take some time to load
            questions.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "rgba(245, 245, 245, 1)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            backgroundColor: "white",
            borderRadius: "10px",
            width: "90%",
            border: "1px solid black",
          }}
        >
          <h1
            style={{
              marginBottom: "1rem",
              fontSize: "28px",
              color: score.percentage >= 60 ? "green" : "red",
            }}
          >
            Test Completed!
          </h1>
          <div
            style={{
              marginBottom: "2rem",
              padding: "2rem",
              backgroundColor: "rgba(248, 249, 250, 1)",
              borderRadius: "8px",
            }}
          >
            <h2 style={{ fontSize: "24px", marginBottom: "1rem" }}>
              Your Score
            </h2>
            <p
              style={{
                fontSize: "64px",
                fontWeight: "bold",
                color: score.percentage >= 60 ? "green" : "red",
                marginBottom: "1rem",
              }}
            >
              {score.percentage}%
            </p>
            <p
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: score.percentage >= 60 ? "green" : "red",
                marginBottom: "1rem",
              }}
            >
              {getGrade(score.percentage)}
            </p>
            <p style={{ fontSize: "18px", color: "rgba(102,102,102,1)" }}>
              {score.correct} out of {score.total} questions correct
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(237, 215, 215, 0.66)",
          height: "100vh",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "30px",
            backgroundColor: "white",
            borderRadius: "10px",
            border: "1px solid black",
          }}
        >
          <h1 style={{ marginBottom: "1rem", fontSize: "24px" }}>
            Welcome to the Test
          </h1>
          <p style={{ marginBottom: "2rem", color: "rgba(102,102,102,1)" }}>
            This test contains {questions.length} questions and you have 60
            minutes to complete it.
          </p>
          <button
            onClick={handleStartTest}
            style={{
              backgroundColor: "green",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
            onMouseOver={(e) =>
              (e.target.style.backgroundColor = "rgb(27, 96, 27)")
            }
            onMouseOut={(e) =>
              (e.target.style.backgroundColor = "rgba(70, 155, 70, 0.8)")
            }
          >
            Start Test
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  const Dot = ({ color, label }) => {
    return (
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <div
          style={{
            width: "12px",
            height: "12px",
            borderRadius: "50%",
            backgroundColor: color,
            padding: "1px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              backgroundColor: color,
            }}
          ></div>
        </div>
        <p>{label}</p>
      </div>
    );
  };

  const ControlButtons = () => {
    return (
      <div
        style={{ display: "flex", gap: "8px", margin: "16px 0", width: "70%" }}
      >
        <button
          style={{
            backgroundColor: "red",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "20px",
            cursor: "pointer",
          }}
          onClick={handleReview}
        >
          Review
        </button>
        <div style={{ display: "flex", gap: "5px" }}>
          <button
            style={{
              backgroundColor: "gray",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "20px 0 0 20px",
              cursor: "pointer",
              borderRight: "1px solid black",
            }}
            onClick={handlePrev}
          >
            Previous
          </button>
          <button
            style={{
              backgroundColor: "green",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "0 20px 20px 0",
              cursor: "pointer",
              borderLeft: "1px solid black",
            }}
            onClick={handleNext}
          >
            Next
          </button>
        </div>

        <button
          style={{
            backgroundColor: "green",
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "20px",
            cursor: "pointer",
            marginLeft: "100px",
          }}
          onClick={handleSubmit}
        >
          Submit Test
        </button>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", padding: "24px", gap: "24px" }}>
        {/* Main Question Section */}
        <div
          style={{
            width: "75%",
            border: "1px solid black",
            padding: "16px",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <h2 style={{ fontWeight: "bold" }}>Question {currentQIndex + 1}</h2>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "18px",
                color: "red",
              }}
            >
              {formatTime()}
            </span>
          </div>

          <p style={{ marginBottom: "16px" }}>{currentQ?.question}</p>

          <div style={{ marginBottom: "16px" }}>
            {currentQ?.options.map((opt, i) => (
              <label key={i} style={{ display: "block", marginBottom: "8px" }}>
                <input
                  type="radio"
                  name={`q${currentQ.id}`}
                  value={opt}
                  checked={selectedAnswers[currentQ.id] === opt}
                  onChange={() => handleOptionChange(currentQ.id, opt)}
                />{" "}
                {opt}
              </label>
            ))}
          </div>
        </div>

        <div style={{ width: "25%" }}>
          <h3 style={{ fontWeight: "bold", marginBottom: "12px" }}>
            Question Matrix
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              columnGap: "8px",
              rowGap: "8px",
            }}
          >
            {questions.map((q, index) => {
              let bgColor;
              const color = getColor(q.id);
              if (color === "blue") bgColor = "blue";
              else if (color === "green") bgColor = "green";
              else if (color === "yellow") bgColor = "yellow";
              else if (color === "gray") bgColor = "gray";
              else bgColor = "red";

              return (
                <button
                  key={q.id}
                  onClick={() => handleJump(index)}
                  style={{
                    backgroundColor: bgColor,
                    color: "white",
                    borderTopLeftRadius: "10px",
                    padding: "6px",
                    aspectRatio: "1/1",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <ControlButtons />
      </div>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          marginTop: "16px",
          fontSize: "14px",
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          backgroundColor: "white",
          padding: "8px",
        }}
      >
        <Dot label={"ANSWERED"} color={"green"} />
        <Dot label={"NOT ANSWERED"} color={"yellow"} />
        <Dot label={"NOT ATTEMPTED"} color={"red"} />
        <Dot label={"REVIEW"} color={"gray"} />
      </div>
    </div>
  );
};

export default QuestionPage;
