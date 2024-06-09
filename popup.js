document.getElementById("highlight-btn").addEventListener("click", () => {
  const color = document.getElementById("color").value || "#FFFF00"; // Default to yellow
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "highlight", color: color });
  });
});

document.getElementById("note-btn").addEventListener("click", () => {
  const note = prompt("Enter your note:");
  if (note) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "add-note", note: note });
    });
  }
});

document.getElementById("export-btn").addEventListener("click", () => {
  chrome.storage.sync.get(["annotations"], function (result) {
    const blob = new Blob([JSON.stringify(result.annotations)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "annotations.json";
    a.click();
    URL.revokeObjectURL(url);
  });
});

function loadAnnotations() {
  chrome.storage.sync.get(["annotations"], function (result) {
    const list = document.getElementById("annotations-list");
    list.innerHTML = "";
    if (result.annotations) {
      result.annotations.forEach((annotation, index) => {
        const li = document.createElement("li");
        li.textContent =
          annotation.text +
          (annotation.note ? ` (Note: ${annotation.note})` : "");
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteAnnotation(index));
        li.appendChild(deleteButton);
        list.appendChild(li);
      });
    }
  });
}

function deleteAnnotation(index) {
  chrome.storage.sync.get(["annotations"], function (result) {
    let annotations = result.annotations || [];
    const annotation = annotations[index];
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "delete-annotation",
        annotation: annotation,
      });
    });
    annotations.splice(index, 1);
    chrome.storage.sync.set({ annotations: annotations }, loadAnnotations);
  });
}

document.addEventListener("DOMContentLoaded", loadAnnotations);
