import './style.css'

document.querySelector('#app').innerHTML = `
  <main class="game-wrapper">
    <header>
      <div>
        <h1>비둘기 타워디펜스</h1>
        <p>길이 아닌 곳을 클릭해 타워를 설치하세요.</p>
      </div>

      <div class="status">
        <span id="money">돈: 200</span>
        <span id="lives">생명: 20</span>
        <button id="restartButton">다시 시작</button>
      </div>
    </header>

    <canvas id="gameCanvas" width="960" height="540"></canvas>

    <div class="message" id="message">
      타워 가격은 50원입니다.
    </div>
  </main>
`

const canvas = document.querySelector('#gameCanvas')
const ctx = canvas.getContext('2d')

const moneyElement = document.querySelector('#money')
const livesElement = document.querySelector('#lives')
const messageElement = document.querySelector('#message')
const restartButton = document.querySelector('#restartButton')

const path = [
  { x: -30, y: 270 },
  { x: 220, y: 270 },
  { x: 220, y: 110 },
  { x: 570, y: 110 },
  { x: 570, y: 420 },
  { x: 990, y: 420 },
]

let money
let lives
let enemies
let towers
let shots
let spawnTimer
let gameOver
let previousTime

function resetGame() {
  money = 200
  lives = 20
  enemies = []
  towers = []
  shots = []
  spawnTimer = 0
  gameOver = false
  previousTime = performance.now()

  showMessage('길이 아닌 곳을 클릭해 타워를 설치하세요.')
  updateStatus()
}

function updateStatus() {
  moneyElement.textContent = `돈: ${money}`
  livesElement.textContent = `생명: ${lives}`
}

function showMessage(text) {
  messageElement.textContent = text
}

function createEnemy() {
  enemies.push({
    x: path[0].x,
    y: path[0].y,
    targetIndex: 1,
    speed: 70,
    radius: 16,
    health: 100,
    maxHealth: 100,
    dead: false,
  })
}

function updateEnemy(enemy, deltaTime) {
  const target = path[enemy.targetIndex]

  if (!target) {
    enemy.dead = true
    lives -= 1

    if (lives <= 0) {
      lives = 0
      gameOver = true
      showMessage('게임 오버! 다시 시작 버튼을 누르세요.')
    }

    updateStatus()
    return
  }

  const dx = target.x - enemy.x
  const dy = target.y - enemy.y
  const distance = Math.hypot(dx, dy)
  const movement = enemy.speed * deltaTime

  if (distance <= movement) {
    enemy.x = target.x
    enemy.y = target.y
    enemy.targetIndex += 1
    return
  }

  enemy.x += (dx / distance) * movement
  enemy.y += (dy / distance) * movement
}

function updateTower(tower, deltaTime) {
  tower.cooldown -= deltaTime

  if (tower.cooldown > 0) {
    return
  }

  const target = enemies.find((enemy) => {
    if (enemy.dead) {
      return false
    }

    const distance = Math.hypot(
      enemy.x - tower.x,
      enemy.y - tower.y,
    )

    return distance <= tower.range
  })

  if (!target) {
    return
  }

  target.health -= tower.damage
  tower.cooldown = tower.fireInterval

  shots.push({
    startX: tower.x,
    startY: tower.y,
    endX: target.x,
    endY: target.y,
    remainingTime: 0.08,
  })

  if (target.health <= 0) {
    target.dead = true
    money += 15
    updateStatus()
  }
}

function update(deltaTime) {
  if (gameOver) {
    return
  }

  spawnTimer -= deltaTime

  if (spawnTimer <= 0) {
    createEnemy()
    spawnTimer = 1.3
  }

  enemies.forEach((enemy) => {
    updateEnemy(enemy, deltaTime)
  })

  towers.forEach((tower) => {
    updateTower(tower, deltaTime)
  })

  shots.forEach((shot) => {
    shot.remainingTime -= deltaTime
  })

  enemies = enemies.filter((enemy) => !enemy.dead)
  shots = shots.filter((shot) => shot.remainingTime > 0)
}

function drawBackground() {
  ctx.fillStyle = '#75a843'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.lineWidth = 1

  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, canvas.height)
    ctx.stroke()
  }

  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(canvas.width, y)
    ctx.stroke()
  }
}

function drawPath() {
  ctx.beginPath()
  ctx.moveTo(path[0].x, path[0].y)

  for (let index = 1; index < path.length; index += 1) {
    ctx.lineTo(path[index].x, path[index].y)
  }

  ctx.lineWidth = 76
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#c49a6c'
  ctx.stroke()

  ctx.lineWidth = 4
  ctx.strokeStyle = '#e8c99c'
  ctx.stroke()
}

function drawEnemy(enemy) {
  ctx.beginPath()
  ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2)
  ctx.fillStyle = '#d84343'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(enemy.x - 5, enemy.y - 4, 3, 0, Math.PI * 2)
  ctx.arc(enemy.x + 5, enemy.y - 4, 3, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()

  const healthRatio = Math.max(0, enemy.health / enemy.maxHealth)

  ctx.fillStyle = '#222222'
  ctx.fillRect(enemy.x - 20, enemy.y - 29, 40, 6)

  ctx.fillStyle = '#43d35c'
  ctx.fillRect(enemy.x - 20, enemy.y - 29, 40 * healthRatio, 6)
}

function drawTower(tower) {
  ctx.beginPath()
  ctx.arc(tower.x, tower.y, 23, 0, Math.PI * 2)
  ctx.fillStyle = '#263548'
  ctx.fill()

  ctx.beginPath()
  ctx.arc(tower.x, tower.y, 10, 0, Math.PI * 2)
  ctx.fillStyle = '#ffd43b'
  ctx.fill()

  ctx.fillStyle = '#263548'
  ctx.fillRect(tower.x - 4, tower.y - 31, 8, 23)
}

function drawShot(shot) {
  ctx.beginPath()
  ctx.moveTo(shot.startX, shot.startY)
  ctx.lineTo(shot.endX, shot.endY)
  ctx.lineWidth = 4
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
}

function drawGameOver() {
  if (!gameOver) {
    return
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 58px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2)
}

function draw() {
  drawBackground()
  drawPath()

  towers.forEach(drawTower)
  enemies.forEach(drawEnemy)
  shots.forEach(drawShot)

  drawGameOver()
}

function gameLoop(currentTime) {
  const deltaTime = Math.min(
    (currentTime - previousTime) / 1000,
    0.05,
  )

  previousTime = currentTime

  update(deltaTime)
  draw()

  requestAnimationFrame(gameLoop)
}

function distanceToLineSegment(point, start, end) {
  const lineX = end.x - start.x
  const lineY = end.y - start.y
  const lengthSquared = lineX * lineX + lineY * lineY

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y)
  }

  let position =
    ((point.x - start.x) * lineX +
      (point.y - start.y) * lineY) /
    lengthSquared

  position = Math.max(0, Math.min(1, position))

  const closestX = start.x + position * lineX
  const closestY = start.y + position * lineY

  return Math.hypot(point.x - closestX, point.y - closestY)
}

function isOnPath(point) {
  for (let index = 0; index < path.length - 1; index += 1) {
    const distance = distanceToLineSegment(
      point,
      path[index],
      path[index + 1],
    )

    if (distance < 60) {
      return true
    }
  }

  return false
}

canvas.addEventListener('click', (event) => {
  if (gameOver) {
    return
  }

  const rect = canvas.getBoundingClientRect()

  const x =
    (event.clientX - rect.left) *
    (canvas.width / rect.width)

  const y =
    (event.clientY - rect.top) *
    (canvas.height / rect.height)

  const position = { x, y }

  if (money < 50) {
    showMessage('돈이 부족합니다.')
    return
  }

  if (isOnPath(position)) {
    showMessage('길 위에는 타워를 설치할 수 없습니다.')
    return
  }

  const towerNearby = towers.some((tower) => {
    return Math.hypot(tower.x - x, tower.y - y) < 60
  })

  if (towerNearby) {
    showMessage('다른 타워와 너무 가깝습니다.')
    return
  }

  towers.push({
    x,
    y,
    range: 145,
    damage: 25,
    fireInterval: 0.55,
    cooldown: 0,
  })

  money -= 50
  updateStatus()
  showMessage('타워를 설치했습니다.')
})

restartButton.addEventListener('click', resetGame)

resetGame()
requestAnimationFrame(gameLoop)