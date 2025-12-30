'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Heart, 
  Star, 
  Award, 
  Users, 
  ShoppingBag, 
  Truck, 
  Shield, 
  Clock,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Target
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useLocaleStore } from '@/lib/locale-store'
import { Navbar } from '@/components/navbar'

// Custom hook for counter animation
const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          let startTime: number | null = null
          
          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime
            const progress = Math.min((currentTime - startTime) / duration, 1)
            
            setCount(Math.floor(progress * end))
            
            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }
          
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [end, duration, hasAnimated])

  return { count, ref }
}

export default function AboutPage() {
  // Initialize counters for each stat
  const customerCounter = useCounter(10000, 2000)
  const productCounter = useCounter(50000, 2000)
  const cityCounter = useCounter(58, 2000)
  const yearCounter = useCounter(5, 2000)

  const counters = [customerCounter, productCounter, cityCounter, yearCounter]
  const { t } = useLocaleStore()

  const stats = [
    { label: t?.admin?.stats?.happyCustomers || 'Happy Customers', value: 10000, suffix: '+', icon: Users },
    { label: t?.admin?.stats?.productsSold || 'Products Sold', value: 50000, suffix: '+', icon: Award },
    { label: t?.admin?.stats?.citiesCovered || 'Cities Covered', value: 58, suffix: '', icon: Truck },
    { label: t?.admin?.stats?.yearsExperience || 'Years Experience', value: 5, suffix: '+', icon: Clock }
  ]

  const values = [
    {
      icon: Heart,
      title: t?.admin?.values?.customerFirst || 'Customer First',
      description: t?.admin?.values?.customerFirst || 'Customer First'
    },
    {
      icon: Shield,
      title: t?.admin?.values?.qualityAssurance || 'Quality Assurance',
      description: t?.admin?.values?.qualityAssurance || 'Quality Assurance'
    },
    {
      icon: Truck,
      title: t?.admin?.values?.fastDelivery || 'Fast Delivery',
      description: t?.admin?.values?.fastDelivery || 'Fast Delivery'
    },
    {
      icon: Star,
      title: t?.admin?.values?.excellence || 'Excellence',
      description: t?.admin?.values?.excellence || 'Excellence'
    }
  ]

  const team = [
    {
      name: 'Ahmed Benali',
      role: t?.admin?.team?.founder || 'Founder & CEO',
      image: '/api/upload/images/images-1750886375625-228674510.jpg',
      description: t?.admin?.team?.description1 || 'Passionate about bringing quality products to Algerian customers.'
    },
    {
      name: 'Fatima Khelifi',
      role: t?.admin?.team?.headOfOperations || 'Head of Operations',
      image: '/api/upload/images/images-1750886390313-710777334.jpg',
      description: t?.admin?.team?.description2 || 'Ensures smooth operations and exceptional customer experience.'
    },
    {
      name: 'Mohamed Slimani',
      role: t?.admin?.team?.technologyDirector || 'Technology Director',
      image: '/api/upload/images/images-1750886401381-753593046.jpg',
      description: t?.admin?.team?.description3 || 'Leads our technology initiatives and platform development.'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      
      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 bg-muted/30 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/api/upload/images/images-1750886442569-442546868.jpg"
              alt="About Us Hero"
              fill
              className="object-cover opacity-20"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-background/60" />
          </div>
          
          <div className="max-w-6xl mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-4xl md:text-6xl font-bold mb-6">{'About E-Shop Algeria'}</h1>
                <p className="text-xl text-muted-foreground mb-8">
                  {"We're on a mission to revolutionize online shopping in Algeria"}
                </p>
                <Badge variant="secondary" className="text-lg px-6 py-2">
                  {'Years Experience'} 2019
                </Badge>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex justify-center"
              >
                <div className="relative w-full max-w-md">
                  <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src="/api/upload/images/images-1750886442569-442546868.jpg"
                      alt="E-Shop Algeria Team"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center">
                    <Target className="w-12 h-12 text-primary" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                  ref={counters[index].ref}
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-3xl font-bold mb-2">
                    {counters[index].count.toLocaleString()}{stat.suffix}
                  </div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Who We Are Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                {'Who We Are'}
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto mb-8"></div>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                {'From the heart of Algeria, we are redefining elegance with a style that blends modernity and authenticity.'}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {'LOUD Brands'}
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {'We are a leading Algerian brand specializing in the design and production of occasion wear and everyday clothing, through two distinct branches:'}
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">LOUD Styles</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {'Luxurious wedding and evening gowns.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">LOUDIM</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        {'Chic outerwear and sophisticated casual wear.'}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                  {'We are here to offer Algerian women local choices that powerfully compete with international brands—with complete pride, we are 100% Algerian.'}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/api/upload/images/images-1750886415167-825207562.jpg"
                    alt="LOUD Brands"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                {'Our Story'}
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto mb-8"></div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/api/upload/images/images-1750886415167-221177598.jpg"
                    alt="Our Story"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {'LOUD Brands began as a simple dream: to create local fashion that reflects the identity of the Algerian woman and meets her refined taste for every occasion.'}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {'From a wedding dress that immortalizes life\'s big moment to a casual look that mirrors your everyday self—our journey has been filled with passion, design, and commitment to quality.'}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {'We chose to be different... so we innovated by creating two branches to cater to every aspect of your life:'}
                </p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>LOUD Styles:</strong> {'For every grand moment, a look worthy of you.'}
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      <strong>LOUDIM:</strong> {'For every day, an elegance that suits you.'}
                    </p>
                  </div>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                  {'Today, we are proud to be an Algerian brand making a difference with every step.'}
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                {t?.pages?.about?.ourValues || 'Our Values'}
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto mb-8"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: '✨',
                  title: 'Quality First',
                  description: 'From fabric selection to the final stitch, we prioritize the smallest details.'
                },
                {
                  icon: '✨',
                  title: 'Refined Elegance',
                  description: 'We design pieces that reflect your personality, with a contemporary vision and an Algerian touch.'
                },
                {
                  icon: '✨',
                  title: 'Empowering Local Industry',
                  description: 'Our ultimate pride is being 100% Algerian production.'
                },
                {
                  icon: '✨',
                  title: 'Boldness and Distinction',
                  description: 'We believe every woman deserves to be unique and different.'
                },
                {
                  icon: '✨',
                  title: 'Continuous Innovation',
                  description: 'We follow the latest fashion lines and adapt them to suit your local taste.'
                }
              ].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="text-3xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                {'Why Choose Us?'}
              </h2>
              <div className="w-24 h-1 bg-primary mx-auto mb-8"></div>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                {'Because we are not just a brand; we are an experience.'}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {'LOUD Brands was born to be the first choice for the Algerian woman seeking elegance, distinctiveness, and quality—whether in life\'s grand moments or its everyday details.'}
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {'We know your taste.'}
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {'We understand your needs.'}
                    </p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-2 h-2 bg-primary rounded-full mt-3 flex-shrink-0"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                      {'And we give you everything you need to be you, at your finest.'}
                    </p>
                  </div>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-bold">
                  {'LOUD BRANDS is the name of true Algerian elegance, with local production and a world-class standard.'}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative w-full h-96 rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/api/upload/images/images-1750886415167-825207562.jpg"
                    alt="Why Choose Us"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">{t?.admin?.team?.meetOurTeam || 'Meet Our Team'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {team.map((member, idx) => (
                <Card key={idx} className="text-center">
                  <CardContent className="p-8">
                    <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                      <Image 
                        src={member.image} 
                        alt={member.name} 
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{member.role}</p>
                    <p className="text-muted-foreground text-sm">{member.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Shop with Us?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of satisfied customers who trust E-Shop Algeria for their online shopping needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/products">
                    Browse Products
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/contact">
                    Contact Us
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}