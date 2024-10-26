'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Sun, Moon, ThumbsUp, ThumbsDown } from "lucide-react"
import Sentiment from 'sentiment'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { GoogleGenerativeAI } from "@google/generative-ai"

const sentiment = new Sentiment()
const apiKey = "AIzaSyAehf8XG09Eu9pbGbkObI2gfHCJcxcT4Ww";

if (!apiKey) {
  console.error("Google API key is not set. Please set the NEXT_PUBLIC_GOOGLE_API_KEY environment variable.")
}

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

const generationConfig = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 1024,
}

export default function SentimentAnalyzer() {
  const [review, setReview] = useState('')
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  const summarizeReview = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const sentimentResult = sentiment.analyze(review)
      const chatSession = model.startChat({ generationConfig, history: [] })

      const aiResult = await chatSession.sendMessage(
        `Analyze the following product review:
        "${review}"
        
        Provide a response in the following JSON format:
        {
          "overallSentiment": "One word sentiment: POSITIVE, NEGATIVE, or NEUTRAL",
          "summary": "A 2-3 sentence summary of the review, focusing on the main points and overall sentiment",
          "positiveWords": ["list", "of", "positive", "words", "or", "phrases"],
          "negativeWords": ["list", "of", "negative", "words", "or", "phrases"]
        }
        
        Ensure that the positive and negative words or phrases are directly extracted or closely paraphrased from the original review.`
      )

      const responseText = await aiResult.response.text()
      console.log("response text:", responseText)

      let aiResponse

      try {
        const cleanedResponse = responseText.replace(/```json|```/g, "").trim()
        aiResponse = JSON.parse(cleanedResponse)
      } catch (parseError) {
        throw new Error("Failed to parse AI response as JSON")
      }

      if (!aiResponse.summary) {
        throw new Error("Failed to generate summary")
      }

      setSummary({
        text: aiResponse.summary,
        score: aiResponse.overallSentiment,
        positiveWords: aiResponse.positiveWords,
        negativeWords: aiResponse.negativeWords,
      })
    } catch (err) {
      setError(err.message || "An error occurred while analyzing the review")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey && !isLoading && review.trim()) {
      summarizeReview()
    }
  }

  const handleChange = (e) => {
    setReview(e.target.value)
    if (e.target.value.trim() === '') {
      setSummary(null) 
    }
  }

  const getSentimentColor = (score) => {
    if (score === 'POSITIVE') return 'green'
    if (score === 'NEGATIVE') return 'red'
    return 'yellow'
  }

  return (
    <div className={`min-h-screen w-screen flex items-center justify-center p-4 transition-colors duration-300 ${isDarkMode ? 'bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900' : 'bg-gradient-to-br from-blue-300 via-purple-300 to-pink-300'}`}>
      <Card className={`w-full max-w-lg md:max-w-xl lg:max-w-2xl ${isDarkMode ? 'bg-gray-800/30' : 'bg-white/30'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
                  AI-Powered Product Review Analyzer
                </span>
              </CardTitle>
              <CardDescription className={isDarkMode ? 'text-blue-200' : 'text-blue-800'}>
                Enter your review of the Product, and get an AI-generated summary!
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Sun className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-yellow-500'}`} />
              <Switch
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
                className={`${isDarkMode ? 'bg-blue-600 border-blue-400' : 'bg-yellow-500 border-yellow-400'} rounded-full border-2 p-1`}
              />
              <Moon className={`h-4 w-4 ${isDarkMode ? 'text-blue-300' : 'text-gray-400'}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={review}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter your product review here (Press Ctrl+Enter to analyze)"
            className={`min-h-[100px] ${isDarkMode ? 'bg-gray-700/50 placeholder-gray-400 text-white' : 'bg-white/50 placeholder-gray-500 text-gray-800'}`}
          />
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {summary && (
            <Alert 
              variant="default" 
              className={`
                ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}
                border-2 transition-colors duration-300
                ${summary.score === "POSITIVE" ? 'border-green-500' : summary.score === 'NEGATIVE' ? 'border-red-500' : 'border-yellow-500'}
              `}
            >
              <div className='flex justify-between'>
                <AlertTitle className="flex items-center space-x-2 mb-2">
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
                    AI Summary
                  </span>
                </AlertTitle>
                <AlertTitle className="flex items-center space-x-2 mb-2">
                  <div className="flex items-center">
                    <span className={`mr-2 font-semibold text-${getSentimentColor(summary.score)}-500`}>
                      {summary.score}
                    </span>
                    {summary.score === 'POSITIVE' ? (
                      <ThumbsUp className="h-5 w-5 text-green-500" />
                    ) : summary.score === 'NEGATIVE' ? (
                      <ThumbsDown className="h-5 w-5 text-red-500" />
                    ) : (
                      <span className="h-5 w-5 text-yellow-500">•</span>
                    )}
                  </div>
                </AlertTitle>
              </div>
              <AlertDescription>
                <p className="text-lg mb-4">{summary.text}</p>
                <div className="space-y-2">
                 {(summary.positiveWords.length>0||summary.positiveWords.length>0) && <p className="font-semibold text-lg bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">Sentiment Analysis:</p>}
                  {summary.positiveWords.length > 0 && (
                    <p className="font-medium">
                      Positive aspects: {' '}
                      <span className="text-green-500 font-semibold">
                        {summary.positiveWords.join(', ')}
                      </span>
                    </p>
                  )}
                  {summary.negativeWords.length > 0 && (
                    <p className="font-medium">
                      Negative aspects: {' '}
                      <span className="text-red-500 font-semibold">
                        {summary.negativeWords.join(', ')}
                      </span>
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={summarizeReview} 
            disabled={isLoading || !review.trim()} 
            className={`w-full ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Analyze Review"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}