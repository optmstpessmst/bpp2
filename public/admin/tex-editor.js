CMS.registerEditorComponent({
  id: "tex",
  label: "TeX",
  fields: [
    {
      label: "TeX attachment",
      name: "file",
      widget: "file",
      media_folder: "src/content/editorials",
      public_folder: "src/content/editorials",
    },
    {
      label: "Width",
      name: "width",
      widget: "string",
      required: false,
    },
    {
      label: "Height",
      name: "height",
      widget: "string",
      required: false,
    },
  ],
  pattern: /^\{% tex\s+file="([^"]+)"(?:\s+width="([^"]*)")?(?:\s+height="([^"]*)")?\s+\/%\}$/m,
  fromBlock(match) {
    return {
      file: match[1],
      width: match[2] || "",
      height: match[3] || "",
    };
  },
  toBlock(data) {
    const attributes = [`file="${data.file || ""}"`];
    if (data.width) attributes.push(`width="${data.width}"`);
    if (data.height) attributes.push(`height="${data.height}"`);
    return `{% tex ${attributes.join(" ")} /%}`;
  },
  toPreview(data) {
    const source = data.file ? `TeX attachment: ${data.file}` : "Choose a TeX attachment";
    return h("div", { className: "tex-editor-preview" }, source);
  },
});
