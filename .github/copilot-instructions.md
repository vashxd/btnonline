# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Battleship (Batalha Naval) web application project built with Node.js, Express, and Socket.IO for real-time multiplayer functionality.

## Project Structure
- **Server**: Express.js with Socket.IO for real-time communication
- **Client**: Pure HTML5, CSS3, and JavaScript (no frameworks)
- **Game Logic**: Turn-based battleship game with ship placement and attack phases
- **Responsive Design**: Mobile-first approach with touch-friendly interfaces

## Key Features
- Real-time multiplayer using WebSockets
- Simple matchmaking (players click "Ready" and wait for opponent)
- Responsive design optimized for mobile devices
- Ship placement phase followed by battle phase
- Game state management and turn handling

## Code Style Guidelines
- Use ES6+ modern JavaScript features
- Implement responsive CSS with mobile-first approach
- Keep game logic modular and well-organized
- Use Socket.IO events for all real-time communication
- Ensure cross-browser compatibility
