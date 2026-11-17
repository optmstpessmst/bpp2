CMS.registerEventListener({
  name: "preSave",
  handler: ({ entry }) => {
    if (entry.get("collection") !== "problems") return;

    const slug = entry.get("slug");
    if (!slug) return;

    return entry.get("data").set("id", slug);
  },
});
