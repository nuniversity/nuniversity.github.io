'use client'

export default function Stats() {
  const stats = [
    { label: 'Active Students', value: '25,000+', icon: 'A' },
    { label: 'Courses Available', value: '150+', icon: 'B' },
    { label: 'Expert Instructors', value: '50+', icon: 'C' },
    { label: 'Countries Reached', value: '80+', icon: 'D' },
  ]

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Join Our Growing{' '}
            <span className="text-gradient">Community</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Thousands of learners trust NUniversity to advance their careers and knowledge.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-4xl mb-4">{stat.icon}</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}