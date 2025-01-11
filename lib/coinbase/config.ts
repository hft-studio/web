import fs from 'fs'
import path from 'path'

export function ensureCoinbaseConfig() {
  const configPath = path.join(process.cwd(), 'cdp_api_key.json')
  
  // Only create the file if it doesn't exist
  if (!fs.existsSync(configPath)) {
    const config = {
      apiKey: process.env.CDP_API_KEY,
      apiSecret: process.env.CDP_API_SECRET,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  }

  return configPath
} 