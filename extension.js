const fs = require("fs");
const path = require("path");

const open = require("open");
const vscode = require("vscode");

const filetypes = JSON.parse(fs.readFileSync(path.resolve(__dirname, "filetypes.json"), "utf-8"));

/**
 * Generates modified Base64 Encoded String
 * @param {String} str - The string to be encoded.
 * @returns {String} Base64 Encoded String
 */

const generateEncodedCode = (str) => Buffer.from(str).toString("base64");

/**
 * Generate a URL from using the script-commands
 * by Raycast as a reference.
 * @param {Object} [options]
		Query parameters to be used to 
		construct the completed request.
	* @param {('vercel'|'supabase'|'tailwind'|'bitmap'|'noir'|'ice'|'sand'|'forest'|'mono'|'breeze'|'candy'|'crimson'|'falcon'|'meadow'|'midnight'|'raindrop'|'sunset')} [options.theme]
		The color scheme you want the
		uploaded code to have.
	* @param {(
		'true'|
		'false'
	)} [options.background]
		Will determine whether the background
		of the image is opaque or translucent.
	* @param {(
		'true'|
		'false'
	)} [options.darkMode]
		Will determine whether the background
		behind the text is light or dark.
	* @param {(
		'16'|
		'32'|
		'64'|
		'128'
	)} [options.padding]
		Determines the size of the padding
		around the content of the uploaded text.
	* @param {String} [options.title]
		The title of the code snippet.
	* @param {String} [options.language]
		The language the code is in
	* @param {String} code
		The snippet of code.
	* @returns {String} Returns the URL of the snippet.
*/
const generateRayUrl = (code, options = {}) => {
  const objParams = {...options, title: setTitleName(), code: generateEncodedCode(code), language: getLanguageName()},
    parameters = Object.keys(objParams)
      .map((key) => `${key}=${encodeURIComponent(objParams[key])}`)
      .join("&");

  return "https://ray.so/#" + parameters;
};

function correctIndentation(text) {
  const lines = text.split("\n");
  const indents = lines.filter(Boolean).map((line) => {
    return (line.split(/[^\t\s]/)[0] || "").length;
  });
  const minimumLength = Math.min(...indents);
  return lines
    .map((x) => x.slice(minimumLength))
    .join("\n")
    .trim();
}

function setTitleName() {
  let title =
    vscode.workspace.getConfiguration("ray-this").get("title") === "fileName"
      ? path.basename(vscode.window.activeTextEditor.document.fileName)
      : decodeURIComponent("%E2%80%8B");
  return title;
}

function getLanguageName() {
  const tabFilePath = vscode.window.activeTextEditor.document.fileName;
  const segments = tabFilePath.split(".");
  if (!segments.length) return;
  const extension = segments[segments.length - 1].toLowerCase();
  const [language] = filetypes.filter(({extensions}) => extensions.includes(extension));
  return language ? language.value : "auto";
}

function activate(context) {
  let config = vscode.workspace.getConfiguration("ray-this");
  let background = config.get("background");
  let darkMode = config.get("darkMode");
  let padding = config.get("padding");
  let theme = config.get("theme");

  const updateConfiguration = () => {
    config = vscode.workspace.getConfiguration("ray-this");
    background = config.get("background");
    darkMode = config.get("darkMode");
    padding = config.get("padding");
    theme = config.get("theme");
  };

  const publishSelectedSnippet = vscode.commands.registerCommand("ray-this.publishSelectedSnippet", () => {
    const {activeTextEditor, showErrorMessage, showInformationMessage} = vscode.window;

    // * If there is no active text editor,
    // * return an error message.
    if (!activeTextEditor)
      return showErrorMessage(
        `You need to have an open editor to upload a code snippet to Ray.so.
				Please select a file and make a text selection to upload a snippet.`
      );

    const selectedContent = activeTextEditor.document.getText(activeTextEditor.selection);

    // * If there is no selected content,
    // * return an error message.
    if (!selectedContent)
      return showErrorMessage(
        `You have to have text selected to upload a snippet to Ray.so.
				Please select the text you would like to be included in your snippet.`
      );

    // * Generate URL & open in default browser,
    // * then send success message.
    const url = generateRayUrl(correctIndentation(selectedContent), {
      background: background,
      darkMode: darkMode,
      padding: padding,
      theme: theme,
    });

    showInformationMessage(`Successfully generated Ray.so snippet!`);

    open(url);
  });

  context.subscriptions.push(publishSelectedSnippet);

  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("ray-this")) {
      updateConfiguration();
    }
  });
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
