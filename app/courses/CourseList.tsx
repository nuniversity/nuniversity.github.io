"use client";
import Link from "next/link";
import { useState, useMemo } from "react";

export default function CourseList({ courses }) {
  const [search, setSearch] = useState("");
  const filteredCourses = useMemo(() => {
    const query = search.toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
    );
  }, [search, courses]);

  return (
    <div className="container-custom py-8">
      <h1 className="text-gradient text-4xl font-bold mb-8">Courses</h1>
      <div className="mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search courses…"
          className="w-full p-2 rounded-md border focus:outline-none focus:ring"
        />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {filteredCourses.map((course) => (
          <Link
            key={course.slug}
            href={`/courses/${course.slug}`}
            className="block rounded-2xl border border-border card-hover bg-card text-card-foreground shadow-sm p-6"
          >
            <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
            <p className="text-muted-foreground text-sm">
              {course.description || "Click to learn more."}
            </p>
          </Link>
        ))}
        {filteredCourses.length === 0 && (
          <div className="col-span-2 text-center text-muted-foreground">
            No courses found.
          </div>
        )}
      </div>
    </div>
  );
}
