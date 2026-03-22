declare function GM_xmlhttpRequest(details: {
  method: string;
  url: string;
  onload: (response: { responseText: string; status: number }) => void;
  onerror: (error: unknown) => void;
}): void;

interface TranslateResponse {
  sentences: { trans: string }[];
}

function translateText(text: string): Promise<string> {
  const url =
    "https://translate.googleapis.com/translate_a/single" +
    `?client=gtx&sl=auto&tl=ja&dt=t&q=${encodeURIComponent(text)}`;

  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "GET",
      url,
      onload(response) {
        if (response.status !== 200) {
          reject(new Error(`HTTP ${response.status}`));
          return;
        }
        const data: TranslateResponse = JSON.parse(response.responseText);
        const translated = data.sentences.map((s) => s.trans).join("");
        resolve(translated);
      },
      onerror(error) {
        reject(error);
      },
    });
  });
}

function createPopup(): HTMLDivElement {
  const popup = document.createElement("div");
  popup.id = "tj-popup";
  Object.assign(popup.style, {
    position: "absolute",
    zIndex: "2147483647",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "12px 16px",
    maxWidth: "400px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#333",
    fontFamily: "sans-serif",
    display: "none",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(popup);
  return popup;
}

function showPopup(popup: HTMLDivElement, x: number, y: number, html: string) {
  popup.innerHTML = html;
  popup.style.display = "block";
  popup.style.left = `${x}px`;
  popup.style.top = `${y + 10}px`;

  // 画面外にはみ出す場合の補正
  const rect = popup.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    popup.style.left = `${window.innerWidth - rect.width - 8}px`;
  }
  if (rect.bottom > window.innerHeight) {
    popup.style.top = `${y - rect.height - 10}px`;
  }
}

function hidePopup(popup: HTMLDivElement) {
  popup.style.display = "none";
  popup.innerHTML = "";
}

(function main() {
  const popup = createPopup();

  document.addEventListener("mouseup", async (e: MouseEvent) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || text.length === 0) {
      return;
    }

    // 自分自身のポップアップ内のテキスト選択は無視
    if (popup.contains(e.target as Node)) {
      return;
    }

    const x = e.pageX;
    const y = e.pageY;

    showPopup(popup, x, y, '<span style="color:#999">翻訳中...</span>');

    try {
      const translated = await translateText(text);
      showPopup(popup, x, y, translated);
    } catch {
      showPopup(
        popup,
        x,
        y,
        '<span style="color:red">翻訳に失敗しました</span>'
      );
    }
  });

  // ポップアップ外をクリックしたら閉じる
  document.addEventListener("mousedown", (e: MouseEvent) => {
    if (!popup.contains(e.target as Node)) {
      hidePopup(popup);
    }
  });

  // Escキーでも閉じる
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      hidePopup(popup);
    }
  });
})();
