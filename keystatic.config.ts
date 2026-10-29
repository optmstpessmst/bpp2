import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    editorials: collection({
      label: 'Editorials',
      slugField: 'title',
      path: 'src/content/editorials/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Problem Title' } }),
        contest: fields.text({ label: 'Contest / Platform (e.g., Codeforces Div. 2)' }),
        tags: fields.array(
            fields.text({ label: 'Tag' }),
            {
                label: 'Tags',
                itemLabel: (props) => props.value || 'New Tag',
            }
        ),
        authors: fields.array(
          fields.object({
            name: fields.text({ 
              label: 'Author Name',
              validation: { isRequired: true }
            }),
            url: fields.text({ 
              label: 'Website / Profile URL (e.g., Codeforces Profile)',
              description: 'Optional link to their profile or website'
            }),
          }),
          {
            label: 'Authors',
            itemLabel: (props) => props.fields.name.value || 'New Author',
            description: 'Add editorial writers.',
          }
        ),
        content: fields.markdoc({
          label: 'Editorial Body',
        }),
      },
    }),
    problems: collection({
      label: 'Problems',
      slugField: 'title',
      path: 'src/content/problems/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Problem Title' } }),
        contest: fields.text({ label: 'Contest / Platform (e.g., Codeforces Div. 2)' }),
        authors: fields.array(
          fields.object({
            name: fields.text({ 
              label: 'Author Name',
              validation: { isRequired: true }
            }),
            role: fields.text({
              label: 'Role (e.g., Problem Setter, Tester)',
              description: 'Optional contribution role'
            }),
            url: fields.text({ 
              label: 'Website / Profile URL',
              description: 'Optional link to their profile or website'
            }),
          }),
          {
            label: 'Authors',
            itemLabel: (props) => {
              const name = props.fields.name.value || 'New Author';
              const role = props.fields.role.value;
              return role ? `${name} (${role})` : name;
            },
            description: 'Add problemsetters, testers, story writers, etc.',
          }
        ),
        content: fields.markdoc({
          label: 'Problem Statement',
        }),
      },
    }),
  },
});