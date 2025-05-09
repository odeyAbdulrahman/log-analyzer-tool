# Next.js Log Analyzer

A modern log analysis tool built with Next.js.

## Features

- Search and filter log files
- View log statistics
- Analyze errors, warnings, and info messages
- View detailed log entries
- Support for multiple log formats

## Getting Started

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Place your log files in the `public/logs` directory
4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Log File Format

The application supports various log formats:

- Standard format: `2023-01-01 12:34:56.789 [ERR] Message`
- Serilog: `2023-01-01 12:34:56 ERROR Message`
- NLog: `2023-01-01 12:34:56,789 [ERROR] Message`
- Log4Net: `2023-01-01 12:34:56,789 [ERROR] Message`

## Configuration

You can configure the log directory in the API routes:

\`\`\`typescript
// app/api/logs/search/route.ts
const logDirectory = path.join(process.cwd(), 'public', 'logs');
\`\`\`

## Deployment

Deploy the application to Vercel:

\`\`\`bash
vercel
\`\`\`

## License

MIT
