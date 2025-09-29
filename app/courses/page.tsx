import fs from "fs";
import path from "path";
import CourseList from "./CourseList"; // <-- NEW

const COURSES_PATH = path.join(process.cwd(), "courses");

function getCourseData(file: string) {
  const slug = file.replace(/\.md$/, "");
  const filePath = path.join(COURSES_PATH, file);
  const content = fs.readFileSync(filePath, "utf-8");
  let title = slug.replace(/-/g, " ");
  let description = "";
  let field = "";

  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (match) {
    const frontmatter = match[1];
    const titleMatch = frontmatter.match(/Title:\s*(.+)/);
    const descMatch = frontmatter.match(/Description:\s*(.+)/);
    const fieldMatch = frontmatter.match(/Field:\s*(.+)/);
    if (titleMatch) title = titleMatch[1].trim();
    if (descMatch) description = descMatch[1].trim();
    if (fieldMatch) field = fieldMatch[1].trim();
  }
  return { slug, title, description, field };
}

export default function CoursesIndex() {
  const files = fs.readdirSync(COURSES_PATH);
  const courses = files.filter(f => f.endsWith(".md")).map(getCourseData);
  return <CourseList courses={courses} />; // pass data to client
}
