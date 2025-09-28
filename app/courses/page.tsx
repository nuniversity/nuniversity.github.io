import fs from "fs";
import path from "path";
import Link from "next/link";

const COURSES_PATH = path.join(process.cwd(), "courses");

function getCourseData(file: string) {
  const slug = file.replace(/\.md$/, "");
  const filePath = path.join(COURSES_PATH, file);
  const content = fs.readFileSync(filePath, "utf-8");

  // Extract title/description from frontmatter (--- ... ---)
  let title = slug.replace(/-/g, " ");
  let description = "";

  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (match) {
    const frontmatter = match[1];
    const titleMatch = frontmatter.match(/title:\s*(.+)/);
    const descMatch = frontmatter.match(/description:\s*(.+)/);

    if (titleMatch) title = titleMatch[1].trim();
    if (descMatch) description = descMatch[1].trim();
  }

  return { slug, title, description };
}

export default function CoursesIndex() {
  const files = fs.readdirSync(COURSES_PATH);
  const courses = files
    .filter((file) => file.endsWith(".md"))
    .map((file) => getCourseData(file));

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Courses</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <Link
            key={course.slug}
            href={`/courses/${course.slug}`}
            className="block rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition p-6 bg-white"
          >
            <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
            <p className="text-gray-600 text-sm">
              {course.description || "Click to learn more."}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}