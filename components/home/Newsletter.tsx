'use client'

export default function Newsletter() {
  return (
    <section className="py-20 gradient-bg">
      <div className="container-custom text-center text-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Stay Updated with NUniversity
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get the latest courses, tools, and learning resources delivered to your inbox. 
            Join thousands of learners who never miss an update.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full sm:w-96 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg px-6 py-4 text-white placeholder-blue-100 focus:ring-2 focus:ring-white focus:border-transparent"
            />
            <button className="w-full sm:w-auto bg-white text-blue-600 font-medium py-4 px-8 rounded-lg hover:bg-gray-100 transition-colors">
              Subscribe Now
            </button>
          </div>

          <p className="text-sm text-blue-200">
            No spam, unsubscribe at any time. We respect your privacy.
          </p>
        </div>
      </div>
    </section>
  )
}