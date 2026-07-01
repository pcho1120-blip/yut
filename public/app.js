const form = document.querySelector("#joke-form");
const statusEl = document.querySelector("#status");
const outputEl = document.querySelector("#joke-output");
const submitButton = document.querySelector("#submit-button");
const intensity = document.querySelector("#intensity");
const intensityValue = document.querySelector("#intensity-value");
const resultZone = document.querySelector(".result-zone");

const loadingLines = [
  "농담 회로 예열 중...",
  "상식과 거리두기 중...",
  "웃음 버튼을 비스듬히 누르는 중...",
  "문장에 이상한 양념 치는 중...",
];

intensity.addEventListener("input", () => {
  intensityValue.textContent = intensity.value;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    style: formData.get("style"),
    topic: formData.get("topic"),
    intensity: Number(formData.get("intensity")),
  };

  setLoading(true);
  resultZone.classList.remove("is-error");
  statusEl.textContent =
    loadingLines[Math.floor(Math.random() * loadingLines.length)];
  outputEl.textContent = "잠시만요. AI가 농담의 중심을 잃고 있습니다.";

  try {
    const response = await fetch("/api/joke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "농담 생성에 실패했습니다.");
    }

    statusEl.textContent = `${data.style} 컨셉으로 생성됨`;
    outputEl.textContent = data.joke;
  } catch (error) {
    resultZone.classList.add("is-error");
    statusEl.textContent = "호출 실패";
    outputEl.textContent =
      error.message || "OpenRouter 응답을 받지 못했습니다.";
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.innerHTML = isLoading
    ? '<span class="button-icon" aria-hidden="true">...</span>제조 중'
    : '<span class="button-icon" aria-hidden="true">↯</span>농담 투척';
}
