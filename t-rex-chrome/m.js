document.addEventListener('DOMContentLoaded', function() {
    const dino = document.querySelector('.dino')
    const grid = document.querySelector('.grid')
    const alert = document.getElementById('alert')
    let gravity = 0.9
    let isJumping = false
    let isGameOver = false

    let position = 0

    function startGame() {
        // Reset game state
        isGameOver = false
        isJumping = false
        position = 0
        dino.style.bottom = position + 'px' // Reset dino position
        dino.style.display = 'block'        // Ensure dino is visible
        alert.innerHTML = ''                // Clear game over message

        // Clear obstacles if any exist
        while (grid.firstChild) {
            grid.removeChild(grid.firstChild)
        }

        // Re-add the dino to the grid (in case it's missing)
        if (!grid.contains(dino)) {
            grid.appendChild(dino)
        }

        generateObstacles() // Start generating obstacles
    }

    function control() {
        if (!isJumping && !isGameOver) {
            jump()
        } else if (isGameOver) {
            // Restart the game if the game is over
            startGame()
        }
    }

    document.addEventListener('touchstart', control)
    document.addEventListener('click', control) // For desktop users to also use a click

    function jump() {
        let count = 0
        isJumping = true
        let timerId = setInterval(function() {

            // Move down
            if (count === 15) {
                clearInterval(timerId)
                let downTimerId = setInterval(function() {
                    if (count === 0) {
                        clearInterval(downTimerId)
                        isJumping = false
                    }
                    position -= 5
                    count--
                    position = position * gravity
                    dino.style.bottom = position + 'px'
                }, 20)
            }

            // Move up
            position += 30
            count++
            position = position * gravity
            dino.style.bottom = position + 'px'
        }, 20)
    }

    function generateObstacles() {
        if (!isGameOver) {
            let randomTime = Math.random() * 4000
            let obstaclePosition = 1000
            const obstacle = document.createElement('div')
            obstacle.classList.add('obstacle')
            grid.appendChild(obstacle)
            obstacle.style.left = obstaclePosition + 'px'

            let timerId = setInterval(function() {
                if (obstaclePosition > 0 && obstaclePosition < 60 && position < 60) {
                    clearInterval(timerId)
                    alert.innerHTML = 'Game Over! Tap to restart.'
                    isGameOver = true
                    dino.style.display = 'none' // Hide the dino on game over
                }
                obstaclePosition -= 10
                obstacle.style.left = obstaclePosition + 'px'
            }, 20)
            setTimeout(generateObstacles, randomTime)
        }
    }

    startGame() // Initialize the game on load
})
