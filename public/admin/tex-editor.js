CMS.registerEditorComponent({
  id: "tex",
  label: "TeX attachment",
  fields: [
    {
      label: "TeX attachment",
      name: "file",
      widget: "file",
      required: true,
      media_folder: "/src/content/editorials/uploads",
      public_folder: "src/content/editorials/uploads",
      choose_url: false,
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
    const attributes = [`file="${data.file}"`];
    if (data.width) attributes.push(`width="${data.width}"`);
    if (data.height) attributes.push(`height="${data.height}"`);
    return `{% tex ${attributes.join(" ")} /%}`;
  },
  toPreview(data) {
    return h("div", { className: "tex-editor-preview" }, `TeX attachment: ${data.file}`);
  },
});

CMS.registerEditorComponent({
  id: "tex-source",
  label: "TeX source",
  fields: [
    {
      label: "TeX source",
      name: "raw",
      widget: "text",
      required: true,
    },
  ],
  pattern: /^```tex\n([\s\S]*?)\n```$/m,
  fromBlock(match) {
    return { raw: match[1] };
  },
  toBlock(data) {
    return `\`\`\`tex\n${data.raw}\n\`\`\``;
  },
  toPreview() {
    return h("div", { className: "tex-editor-preview" }, "TeX source (preview unavailable)");
  },
});
