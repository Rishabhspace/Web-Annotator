document.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  const selectedText = selection.toString();
  if (selectedText) {
    chrome.runtime.sendMessage({ action: "textSelected", text: selectedText });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "highlight") {
    highlightText(message.color);
  } else if (message.action === "add-note") {
    addNoteToText(message.note);
  } else if (message.action === "delete-annotation") {
    deleteAnnotation(message.annotation);
  }
});

function highlightText(color) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.style.backgroundColor = color;
    span.textContent = selection.toString();
    range.deleteContents();
    range.insertNode(span);
    saveAnnotation({
      text: span.textContent,
      color: color,
      xpath: getXPath(range.startContainer),
      startOffset: range.startOffset,
      endOffset: range.endOffset,
    });
  }
}

function addNoteToText(note) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.style.backgroundColor = "yellow";
    span.textContent = selection.toString();
    range.deleteContents();
    range.insertNode(span);
    saveAnnotation({
      text: span.textContent,
      note: note,
      xpath: getXPath(range.startContainer),
      startOffset: range.startOffset,
      endOffset: range.endOffset,
    });
  }
}

function saveAnnotation(annotation) {
  chrome.storage.sync.get(["annotations"], function (result) {
    let annotations = result.annotations || [];
    annotations.push(annotation);
    chrome.storage.sync.set({ annotations: annotations });
  });
}

function getXPath(node) {
  let segments = [];
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode;
  }
  while (node && node.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling = node.previousSibling;
    while (sibling) {
      if (
        sibling.nodeType === Node.ELEMENT_NODE &&
        sibling.nodeName === node.nodeName
      ) {
        index++;
      }
      sibling = sibling.previousSibling;
    }
    const segment = node.nodeName + (index ? `[${index + 1}]` : "");
    segments.unshift(segment);
    node = node.parentNode;
  }
  return segments.length ? "/" + segments.join("/") : null;
}

function applyAnnotation(annotation) {
  const element = getElementByXPath(annotation.xpath);
  if (element) {
    const range = document.createRange();
    const textNode = getTextNode(element, annotation.startOffset);
    range.setStart(textNode, annotation.startOffset);
    range.setEnd(textNode, annotation.endOffset);
    const span = document.createElement("span");
    span.style.backgroundColor = annotation.color || "yellow";
    span.textContent = annotation.text;
    range.deleteContents();
    range.insertNode(span);
  }
}

function deleteAnnotation(annotation) {
  const element = getElementByXPath(annotation.xpath);
  if (element) {
    const range = document.createRange();
    const textNode = getTextNode(element, annotation.startOffset);
    range.setStart(textNode, annotation.startOffset);
    range.setEnd(textNode, annotation.endOffset);
    const span = document.createElement("span");
    range.surroundContents(span);
    span.outerHTML = span.innerHTML; // Remove the span but keep the text
    removeAnnotationFromStorage(annotation);
  }
}

function removeAnnotationFromStorage(annotation) {
  chrome.storage.sync.get(["annotations"], function (result) {
    let annotations = result.annotations || [];
    annotations = annotations.filter(
      (a) =>
        !(
          a.text === annotation.text &&
          a.startOffset === annotation.startOffset &&
          a.endOffset === annotation.endOffset &&
          a.xpath === annotation.xpath
        )
    );
    chrome.storage.sync.set({ annotations: annotations });
  });
}

function getElementByXPath(path) {
  return document.evaluate(
    path,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
}

function getTextNode(node, offset) {
  let currentNode = node;
  let count = 0;
  while (currentNode && count < offset) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      count += currentNode.textContent.length;
    }
    currentNode = currentNode.firstChild || currentNode.nextSibling;
  }
  return currentNode;
}

function loadAnnotations() {
  chrome.storage.sync.get(["annotations"], function (result) {
    if (result.annotations) {
      result.annotations.forEach(applyAnnotation);
    }
  });
}

window.addEventListener("DOMContentLoaded", loadAnnotations);
window.addEventListener("load", loadAnnotations);
