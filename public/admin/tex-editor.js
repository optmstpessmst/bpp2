CMS.registerEditorComponent({
  id: "tex",
  label: "TeX attachment",
  fields: [
    {
      label: "TeX attachment",
      name: "file",
      widget: "file",
      required: true,
      choose_url: false,
    }
  ],
  pattern: /^\{% tex\s+file="([^"]+)"\s+\/%\}$/m,
  fromBlock(match) {
    return {
      file: match[1],
    };
  },
  toBlock(data) {
    const attributes = [`file="${data.file}"`];
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
