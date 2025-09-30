"use client";
import Link from "next/link";
import { useState, useMemo } from "react";

export default function CourseList({ courses }) {
  const [search, setSearch] = useState("");
  const filteredCourses = useMemo(() => {
    const query = search.toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(query) 
        || c.description.toLowerCase().includes(query) 
        || c.field.toLowerCase().includes(query) 
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
            className="
              group relative flex flex-col justify-between 
              rounded-xl border border-gray-200 dark:border-gray-700 
              bg-white dark:bg-gray-900 
              shadow-sm hover:shadow-lg hover:border-primary 
              transition-all duration-200 
              p-6
            "
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary mb-3">
                {course.title}
              </h2>

              <div className="mb-2">
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                  {course.description || "Click to learn more."}
                </p>
              </div>

              {course.field && (
                <div>
                  <p className="inline-block mt-1 text-xs font-medium text-primary bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded">
                    {course.field}
                  </p>
                </div>
              )}
            </div>
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
