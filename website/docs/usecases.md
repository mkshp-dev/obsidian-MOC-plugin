---
sidebar_position: 3
---

### Extracting Tasks Grouped by Folder
Search the `Projects/` folder recursively for incomplete tasks, sorting notes by filename, and grouping the output by their parent folder path:

````yaml
```moc
folder: Projects
element: Task
filter: is_incomplete()
recursive: true
groupBy: folder
sort: name asc
```
````

### Extracting Headings Filtered by Tag and Grouped by Tag
Search the entire vault for headings containing the hashtag `#review`, grouping them under their corresponding tag headings:

````yaml
```moc
folder: ""
element: Heading
filter: has_tag("#review")
recursive: true
groupBy: tag
```
````

### Advanced Frontmatter Property Filtering
Extract lists from notes in the `Archive` folder that have the frontmatter property `archived: true`:

````yaml
```moc
folder: Archive
element: List
filter: properties(archived == true)
```
````

### Find & Replace Rules and Spacing Customization
Extract paragraphs containing the word "meeting" from notes, applying a chain of two cleanup rules, setting empty lines between paragraphs from the same note, and divider lines between different note blocks:

````yaml
```moc
folder: Meetings
element: Paragraph
filter: contains("meeting")
applyFnR: ["remove-redundancies", "clean-headers"]
blockSeparator: newline
noteSeparator: divider
```
````