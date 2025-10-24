'use client';

import Link from 'next/link'
import Image from "next/image"
import { motion } from 'framer-motion';
import { Rocket, Target, Zap, Users, Award, Heart, ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { easeOut, easeInOut } from "framer-motion";


interface ValueItem {
  title: string;
  description: string;
}

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  link: string;
}

interface AboutContent {
  hero: {
    title: string;
    description: string;
  };
  mission: {
    title: string;
    description: string;
  };
  vision: {
    title: string;
    description: string;
  };
  values: {
    title: string;
    items: ValueItem[];
  };
  team: {
    title: string;
    description: string;
    members: TeamMember[];
  };
}

interface AboutPageClientProps {
  content: AboutContent;
}

export default function AboutPageClient({ content }: AboutPageClientProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: easeOut }
    }
  };

  const floatingVariants = {
    initial: { y: 0 },
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: easeInOut
      }
    }
  };

  const valueIcons = [Zap, Award, Sparkles];


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Hero Section with Animated Background */}
      <section className="relative overflow-hidden py-24 md:py-32">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: easeInOut }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -30, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: easeInOut }}
          />
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="inline-block mb-6"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {content.hero.title}
            </h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed"
            >
              {content.hero.description}
            </motion.p>

            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex items-center justify-center gap-4 mt-10"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary flex items-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div> */}
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 container-custom">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid md:grid-cols-2 gap-8"
        >
          {[
            { ...content.mission, icon: Target, color: 'blue' },
            { ...content.vision, icon: Rocket, color: 'purple' }
          ].map((item, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-10 shadow-xl border border-gray-200 dark:border-gray-700 h-full">
                <motion.div
                  variants={floatingVariants}
                  initial="initial"
                  animate="animate"
                  className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${
                    item.color === 'blue' ? 'from-blue-500 to-blue-600' : 'from-purple-500 to-purple-600'
                  } mb-6`}
                >
                  <item.icon className="w-8 h-8 text-white" />
                </motion.div>

                <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                  {item.title}
                </h2>
                
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {item.description}
                </p>

                <motion.div
                  className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.1, rotate: 45 }}
                >
                  <ArrowRight className="w-6 h-6 text-gray-400" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Values Section */}
      <section className="py-20 container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {content.values.title}
            </span>
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid md:grid-cols-3 gap-8"
        >
          {content.values.items.map((value, idx) => {
            const IconComponent = valueIcons[idx] || Zap;
            
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                onHoverStart={() => setHoveredValue(idx)}
                onHoverEnd={() => setHoveredValue(null)}
                className="relative group"
              >
                <motion.div
                  animate={{
                    scale: hoveredValue === idx ? 1.05 : 1,
                    rotateY: hoveredValue === idx ? 5 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 h-full"
                >
                  <motion.div
                    animate={{
                      rotate: hoveredValue === idx ? 360 : 0,
                      scale: hoveredValue === idx ? 1.1 : 1
                    }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6"
                  >
                    <IconComponent className="w-7 h-7 text-white" />
                  </motion.div>

                  <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
                    {value.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {value.description}
                  </p>

                  {/* Decorative element */}
                  <motion.div
                    className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-bl-3xl"
                    animate={{
                      opacity: hoveredValue === idx ? 1 : 0,
                      scale: hoveredValue === idx ? 1 : 0.8
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Team Section */}
      <section className="py-20 container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {content.team.title}
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {content.team.description}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {content.team.members.map((member, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -10 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
              
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg"
                  >
                    {/* <Users className="w-12 h-12 text-white" /> */}
                    <Image
                      src={`/team/${member.name.toLowerCase().replace(/\s+/g, "-")}.png`}
                      alt={member.name}
                      width={200}
                      height={200}
                      className="rounded-full object-cover"
                    />
                  </motion.div>

                  <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                    {member.name}
                  </h3>
                  
                  <p className="text-lg text-purple-600 dark:text-purple-400 font-semibold mb-4">
                    {member.role}
                  </p>
                  
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {member.bio}
                  </p>

                  <motion.div
                    className="mt-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium"
                    whileHover={{ x: 5 }}
                  >
                    Learn more <Link href={member.link} className="hover:text-white transition-colors"><ArrowRight className="w-4 h-4" /> </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}