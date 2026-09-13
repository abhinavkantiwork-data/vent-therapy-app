import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Mic, 
  Heart, 
  Shield, 
  Brain, 
  Users, 
  MessageCircle, 
  TrendingUp,
  ArrowRight,
  Mail,
  Phone,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqData = [
    {
      question: 'Is my privacy protected?',
      answer: `Absolutely. We use enterprise-grade encryption to protect your data. Your conversations are private and never shared with third parties. You have complete control over your information.`
    },
    {
      question: 'How does the AI understand my emotions?',
      answer: `Our AI is trained on extensive emotional intelligence data and uses advanced natural language processing to understand context, tone, and emotional nuances in your conversations.`
    },
    {
      question: 'Can Vent0.002 replace traditional therapy?',
      answer: `Vent0.002 is designed to complement, not replace, professional mental health care. It's perfect for daily emotional support, but we always encourage seeking professional help for serious mental health concerns.`
    },
    {
      question: `What if I'm in crisis?`,
      answer: `If you're experiencing a mental health crisis, please contact emergency services or a crisis hotline immediately. Vent0.002 is not a crisis intervention tool and cannot provide emergency mental health support.`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-50">
      {/* Floating Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
        <div className="hero-signal" aria-hidden="true">
          <div className="hero-signal-ring hero-signal-ring-one" />
          <div className="hero-signal-ring hero-signal-ring-two" />
          <div className="hero-signal-core"><Brain className="w-12 h-12 text-white" /></div>
        </div>
        <div className="relative z-10 text-center max-w-4xl mx-auto hero-copy">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-white/80 shadow-sm mb-6 animate-fadeIn">
            <span className="live-dot" />
            <span className="text-sm font-medium tracking-wide text-gray-700">A quiet place to be heard</span>
          </div>
          <div className="flex items-center justify-center mb-6 animate-fadeIn">
            <Sparkles className="text-blue-400 w-8 h-8 mr-3 animate-spin-slow" />
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 animate-hero-title">
              VENT<span className="text-blue-400">0.002</span>
            </h1>
          </div>
          <h2 className="text-3xl md:text-4xl font-light text-gray-800 mb-6 animate-fadeIn animation-delay-200">
            Begin your journey to emotional wellness
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed animate-fadeIn animation-delay-400">
            A private, responsive space to talk, reflect, and find your next steady breath.
          </p>
          <div className="space-y-4">
            <Link
              to={user ? '/dashboard' : '/login'}
              className="inline-flex items-center px-8 py-4 bg-blue-400 text-white rounded-full text-lg font-medium hover:bg-blue-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl animate-hero-cta"
            >
              {user ? 'Go to your space' : 'Vent Now'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
          <p className="text-gray-500 mt-8 text-lg">Private. Secure. Just for you.</p>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              About Vent0.002
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We understand that sometimes the weight of emotions can feel unbearable. 
              Vent0.002 is your compassionate companion, ready to listen when you need to talk, 
              understand when you need to be heard, and guide you when you need direction.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                You're not alone in this journey
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6">
                Our AI therapist creates a safe, judgment-free space where you can freely express 
                your thoughts and feelings. Whether you're feeling anxious, stressed, or simply 
                need someone to talk to, we're here to support you.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Take a breath. Start when you're ready. Your emotional wellness matters, 
                and we're committed to helping you find your path to peace.
              </p>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-4">
                  <Heart className="w-8 h-8 text-blue-600 mr-3" />
                  <h4 className="text-xl font-semibold text-gray-900">Emotional Support</h4>
                </div>
                <p className="text-gray-600">
                  Receive compassionate responses tailored to your emotional needs, 
                  helping you process feelings and find clarity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-100 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, intuitive, and designed with your comfort in mind
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mic className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Voice Chat</h3>
              <p className="text-gray-600">
                Speak naturally with our AI therapist. Your voice is heard, understood, 
                and responded to with empathy and care.
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Mood Tracking</h3>
              <p className="text-gray-600">
                Track your emotional patterns over time and gain insights into your 
                mental health journey with gentle guidance.
              </p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Relaxation Tools</h3>
              <p className="text-gray-600">
                Access calming techniques, breathing exercises, and mindfulness practices 
                to help you find peace in moments of stress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Why Choose Vent0.002
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Designed with your emotional safety and growth in mind
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Privacy</h3>
                <p className="text-gray-600">
                  Your conversations are private and secure. We use advanced encryption 
                  to protect your personal information.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Non-Judgmental Space</h3>
                <p className="text-gray-600">
                  Express yourself freely without fear of judgment. Our AI provides 
                  unconditional positive regard and support.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Insights</h3>
                <p className="text-gray-600">
                  Receive gentle insights about your emotional patterns and progress 
                  on your wellness journey.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Always Available</h3>
                <p className="text-gray-600">
                  Access support whenever you need it, day or night. No appointments 
                  needed, no waiting required.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Care</h3>
                <p className="text-gray-600">
                  Our AI learns your preferences and adapts to provide the most 
                  helpful and relevant support for you.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Emotional Growth</h3>
                <p className="text-gray-600">
                  Build emotional resilience and develop healthy coping mechanisms 
                  through guided conversations and exercises.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Vent0.002
            </p>
          </div>
          <div className="space-y-4">
            {faqData.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg">
                <button
                  className="w-full flex items-center justify-between px-8 py-6 text-left focus:outline-none"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                >
                  <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                  <ChevronDown className={`w-6 h-6 text-blue-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-8 pb-6 text-gray-600 animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Get in Touch
            </h2>
            <p className="text-xl text-gray-600">
              We're here to help and answer any questions you might have
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center p-8 bg-gray-50 rounded-2xl">
              <Mail className="w-8 h-8 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600">support@vent0.002.com</p>
            </div>
            
            <div className="text-center p-8 bg-gray-50 rounded-2xl">
              <Phone className="w-8 h-8 text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600">+91 9877382390</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="w-6 h-6 text-blue-300 mr-2" />
            <h3 className="text-2xl font-bold">VENT0.002</h3>
          </div>
          <p className="text-gray-400 mb-6">
            Your journey to emotional wellness starts here
          </p>
          <div className="flex justify-center space-x-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
          <p className="text-gray-500 text-sm mt-8">
            © 2024 Vent0.002. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;