# Trachtenberg Speed Mathematics

An interactive web application for learning and practicing the Trachtenberg system of rapid mental calculation.

## Overview

The Trachtenberg System is a method of rapid mental calculation developed by Jakow Trachtenberg during his years as a prisoner in a Nazi concentration camp. This application teaches these powerful techniques through interactive lessons, practice exercises, and timed assessments.

## Features

### Educational Content
- **8 Multiplication Techniques**: Learn specialized methods for multiplying by 5, 6, 7, 8, 9, 11, 12, and general two-digit multiplication
- **Step-by-Step Animations**: Visual walkthroughs showing exactly how each technique works
- **Rule Boxes**: Clear, memorable rules for each method
- **Tips and Tricks**: Pro tips for faster mental calculation

### Practice Mode
- **Technique Selection**: Practice individual techniques or try mixed problems
- **Instant Feedback**: Know immediately if your answer is correct
- **Hints**: Get help when you're stuck without revealing the answer
- **Session Statistics**: Track your accuracy and streak within each session

### Assessment Tests
- **Customizable Tests**: Choose which techniques to include
- **Configurable Length**: 10, 20, or 30 questions
- **Time Limits**: Optional 5, 10, or 15-minute time limits
- **Detailed Results**: See your score, grade, and breakdown by technique
- **Mistake Review**: Review incorrect answers after completion

### Progress Tracking
- **Persistent Data**: All progress saved locally in your browser
- **Mastery System**: Earn stars as you improve at each technique
- **Test History**: Track your test scores over time
- **Data Export/Import**: Backup or transfer your progress

### Responsive Design
- Works on desktop, tablet, and mobile devices
- Touch-friendly interface
- Adaptive layout for different screen sizes

## Getting Started

### Running Locally

1. Simply open `trachtenberg.html` in a web browser
2. No server or build process required
3. All functionality is self-contained in a single HTML file

### On a Web Server

Place the `trachtenberg.html` file in your web root or static files directory. The application will be accessible at `/trachtenberg.html`.

For Hugo sites (like rowstu.net), place in the `static/` directory.

## Usage Guide

### Learning a Technique

1. Click on any technique card on the Home page, or navigate to **Learn**
2. Read the explanation and the rule box
3. Click **"Show Step-by-Step"** to see an animated walkthrough
4. Try the practice problems to reinforce your learning

### Practicing

1. Navigate to **Practice**
2. Select a technique or choose **"Mixed Practice"** for variety
3. Enter your answer and press Enter or click **"Check Answer"**
4. Use the hint button if you need help
5. Track your streak and try to improve!

### Taking a Test

1. Navigate to **Test**
2. Select which techniques to include
3. Choose the number of questions and time limit
4. Click **"Begin Test"**
5. Answer each question as quickly and accurately as possible
6. Review your results and learn from mistakes

### Tracking Progress

1. Navigate to **Progress** to see your statistics
2. View mastery levels for each technique
3. Review your test history
4. Export your data for backup using the **"Export Data"** button

## Techniques Covered

| Technique | Difficulty | Description |
|-----------|------------|-------------|
| ×11 | Beginner | Add each digit to its right neighbor |
| ×12 | Beginner | Double each digit and add its right neighbor |
| ×5 | Beginner | Half the neighbor, add 5 if odd |
| ×6 | Intermediate | Digit + half neighbor, add 5 if odd |
| ×7 | Intermediate | Double digit + half neighbor, add 5 if odd |
| ×8 | Intermediate | Triple doubling method |
| ×9 | Intermediate | Complement method (subtract from 9/10) |
| General | Advanced | Two-finger method for any multiplication |

## Technical Details

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript required
- Local Storage for progress persistence

### Dependencies
- Google Fonts (Libre Baskerville, JetBrains Mono)
- No JavaScript frameworks required
- No build process needed

### Data Storage
All user data is stored in the browser's `localStorage` under the key `trachtenberg-progress`. The data includes:
- Total problems attempted and correct
- Per-technique statistics
- Test history (last 20 tests)
- Current and best streaks

### File Structure
```
trachtenberg.html          # Main application (single file)
trachtenberg-readme.md     # This documentation
```

## Customization

### Modifying Techniques

The `techniques` object in the JavaScript contains all technique definitions. Each technique includes:
- `name`: Display name
- `multiplier`: The number being multiplied by
- `generateProblem()`: Function to create random problems
- `getSteps()`: Function to generate step-by-step explanations
- `getHint()`: Function to provide hints

### Styling

CSS variables at the top of the `<style>` section control the visual theme:
- `--bg-*`: Background colors
- `--ink-*`: Text colors
- `--accent-*`: Accent colors
- `--font-*`: Typography
- `--space-*`: Spacing scale

## Credits

- **Trachtenberg System**: Developed by Jakow Trachtenberg (1888-1953)
- **Application**: Created for rowstu.net
- **Typography**: Libre Baskerville & JetBrains Mono via Google Fonts

## License

This application is provided for educational purposes.
