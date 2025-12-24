'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  HelpCircle,
  Truck,
  CreditCard,
  RotateCcw,
  Shield,
  Phone
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

const faqCategories = [
  {
    id: 'orders',
    title: 'Orders & Delivery',
    icon: Truck,
    questions: [
      {
        question: 'How long does delivery take?',
        answer: 'Delivery typically takes 2-5 business days depending on your location within Algeria. Orders placed before 2 PM are usually processed the same day.'
      },
      {
        question: 'Do you deliver to all wilayas in Algeria?',
        answer: 'Yes, we deliver to all 48 wilayas across Algeria. Delivery fees may vary based on location and distance from our distribution centers.'
      },
      {
        question: 'Can I track my order?',
        answer: 'Absolutely! Once your order is shipped, you\'ll receive a tracking number via SMS and email. You can track your order status on our website or by calling our customer service.'
      },
      {
        question: 'What if I\'m not home during delivery?',
        answer: 'Our delivery team will attempt to contact you. If you\'re not available, they\'ll leave a notice and attempt redelivery the next business day. You can also arrange pickup from our nearest delivery desk.'
      }
    ]
  },
  {
    id: 'payment',
    title: 'Payment & Pricing',
    icon: CreditCard,
    questions: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept cash on delivery (COD), bank transfers, and major credit/debit cards. All online payments are processed securely through our encrypted payment gateway.'
      },
      {
        question: 'Is cash on delivery available?',
        answer: 'Yes, cash on delivery is available for all orders. You can pay in cash when your order is delivered to your doorstep.'
      },
      {
        question: 'Are there any additional fees?',
        answer: 'Delivery is free for orders over 5000 DA. For smaller orders, a delivery fee of 500 DA applies. There are no hidden fees - the price you see is the price you pay.'
      },
      {
        question: 'Can I get a receipt for my purchase?',
        answer: 'Yes, you\'ll receive a digital receipt via email immediately after purchase, and a physical receipt with your delivery.'
      }
    ]
  },
  {
    id: 'returns',
    title: 'Returns & Exchanges',
    icon: RotateCcw,
    questions: [
      {
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for most items. Products must be in original condition with tags attached. Some items like personal care products cannot be returned for hygiene reasons.'
      },
      {
        question: 'How do I return an item?',
        answer: 'Contact our customer service to initiate a return. We\'ll provide you with a return authorization number and instructions. You can either schedule a pickup or drop off at our nearest location.'
      },
      {
        question: 'When will I receive my refund?',
        answer: 'Refunds are processed within 5-7 business days after we receive and inspect the returned item. The refund will be credited to your original payment method.'
      },
      {
        question: 'Can I exchange an item for a different size or color?',
        answer: 'Yes, exchanges are available for items of the same value. If there\'s a price difference, you\'ll need to pay the difference or receive a refund for the excess amount.'
      }
    ]
  },
  {
    id: 'account',
    title: 'Account & Security',
    icon: Shield,
    questions: [
      {
        question: 'Do I need to create an account to shop?',
        answer: 'No, you can shop as a guest. However, creating an account allows you to track orders, save favorites, and enjoy faster checkout for future purchases.'
      },
      {
        question: 'How do I reset my password?',
        answer: 'Click on "Forgot Password" on the login page and enter your email address. You\'ll receive a password reset link within a few minutes.'
      },
      {
        question: 'Is my personal information secure?',
        answer: 'Yes, we use industry-standard encryption to protect your personal and payment information. We never share your data with third parties without your consent.'
      },
      {
        question: 'How do I update my account information?',
        answer: 'Log into your account and go to "My Profile" to update your personal information, addresses, and preferences.'
      }
    ]
  },
  {
    id: 'products',
    title: 'Products & Quality',
    icon: HelpCircle,
    questions: [
      {
        question: 'Are your products authentic?',
        answer: 'Yes, all our products are 100% authentic. We work directly with authorized distributors and brands to ensure product authenticity and quality.'
      },
      {
        question: 'Do you offer warranties on products?',
        answer: 'Yes, most electronic and appliance products come with manufacturer warranties. Warranty terms vary by product and brand - check the product page for specific details.'
      },
      {
        question: 'What if I receive a damaged product?',
        answer: 'If you receive a damaged product, contact us immediately with photos of the damage. We\'ll arrange for a replacement or full refund at no cost to you.'
      },
      {
        question: 'Can I see product reviews?',
        answer: 'Yes, verified customer reviews are available on each product page. These reviews help you make informed purchasing decisions based on real customer experiences.'
      }
    ]
  }
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const toggleExpanded = (categoryId: string, questionIndex: number) => {
    const itemId = `${categoryId}-${questionIndex}`
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      searchQuery === '' || 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => 
    selectedCategory === null || 
    category.id === selectedCategory ||
    category.questions.length > 0
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-16">
        {/* Header */}
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Frequently Asked Questions
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Find answers to common questions about shopping, delivery, returns, and more.
              </p>
              
              {/* Search */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 py-3 text-lg"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8 border-b">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(null)}
                className="flex items-center"
              >
                All Categories
              </Button>
              {faqCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center"
                >
                  <category.icon className="w-4 h-4 mr-2" />
                  {category.title}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            {filteredCategories.map((category, categoryIndex) => (
              category.questions.length > 0 && (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                  viewport={{ once: true }}
                  className="mb-12"
                >
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                      <category.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">{category.title}</h2>
                  </div>

                  <div className="space-y-4">
                    {category.questions.map((item, questionIndex) => {
                      const itemId = `${category.id}-${questionIndex}`
                      const isExpanded = expandedItems.includes(itemId)

                      return (
                        <Card key={questionIndex} className="overflow-hidden">
                          <CardContent className="p-0">
                            <button
                              onClick={() => toggleExpanded(category.id, questionIndex)}
                              className="w-full p-6 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
                            >
                              <h3 className="font-medium pr-4">{item.question}</h3>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              )}
                            </button>
                            
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border-t"
                              >
                                <div className="p-6 pt-4">
                                  <p className="text-muted-foreground leading-relaxed">
                                    {item.answer}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </motion.div>
              )
            ))}

            {/* No Results */}
            {filteredCategories.every(cat => cat.questions.length === 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any questions matching your search.
                </p>
                <Button onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              </motion.div>
            )}
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
              <p className="text-muted-foreground mb-8">
                Can't find the answer you're looking for? Our customer support team is here to help.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Call Us: +213 XXX XXX XXX
                </Button>
                <Button variant="outline" size="lg">
                  Send us a Message
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}