import { rateLimit } from 'express-rate-limit'
import Sentiment from 'sentiment'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

export default async function handler(req, res) {
console.log("hello")
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    await limiter(req, res)
  } catch {
    return res.status(429).json({ error: 'Too Many Requests' })
  }

  const { review } = req.body

  if (!review || typeof review !== 'string' || review.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid review text' })
  }

  try {
    const sentiment = new Sentiment()
    const result = sentiment.analyze(review)
    res.status(200).json({ 
      score: result.score, 
      comparative: result.comparative,
      positive: result.positive,
      negative: result.negative
    })
  } catch (error) {
    console.error('Sentiment analysis error:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}