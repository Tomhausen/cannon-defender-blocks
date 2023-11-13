namespace SpriteKind {
    export const cannon = SpriteKind.create()
    export const trap = SpriteKind.create()
}
sprites.onOverlap(SpriteKind.cannon, SpriteKind.Enemy, function (cannon, enemy) {
    tiles.setTileAt(cannon.tilemapLocation(), assets.tile`empty`)
    sprites.readDataSprite(cannon, "level_text").destroy()
    cannon.destroy()
    enemy.destroy()
})
function upgrade_cannon (cannon: Sprite) {
    if (info.score() < 100) {
        return
    }
    limit = sprites.readDataNumber(cannon, "time_between_fire")
    limit = Math.constrain(limit - 20, 50, 500)
    sprites.setDataNumber(cannon, "time_between_fire", limit)
    sprites.changeDataNumberBy(cannon, "level", 1)
    sprites.readDataSprite(cannon, "level_text").destroy()
    make_level_text(sprites.readDataNumber(cannon, "level"), cannon)
}
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    if (item_selected == "cannon") {
        item_selected = "trap"
    } else if (item_selected == "trap") {
        item_selected = "cannon"
    }
})
function fire (cannon: Sprite) {
    ball = sprites.create(assets.image`cannon ball`, SpriteKind.Projectile)
    ball.setPosition(cannon.x + 4, cannon.y)
    ball.z = 0
    ball.setVelocity(50, 0)
    ball.setFlag(SpriteFlag.AutoDestroy, true)
    ball.setFlag(SpriteFlag.StayInScreen, false)
    sprites.setDataNumber(cannon, "frames_since_fired", 0)
}
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    tile = selector.tilemapLocation()
    cannons = spriteutils.getSpritesWithin(SpriteKind.cannon, 1, selector)
    if (tiles.tileAtLocationEquals(tile, assets.tile`placed`)) {
        info.changeScoreBy(-100)
        upgrade_cannon(cannons[0])
    } else {
        if (item_selected == "cannon") {
            buy_cannon()
        } else if (item_selected == "trap") {
            buy_trap()
        }
    }
})
scene.onOverlapTile(SpriteKind.Enemy, assets.tile`game over`, function (sprite, location) {
    game.over(false)
})
statusbars.onZero(StatusBarKind.EnemyHealth, function (status) {
    info.changeScoreBy(100)
    sprites.destroy(status.spriteAttachedTo())
    sprites.destroy(status)
})
function buy_cannon () {
    if (info.score() < 100) {
        return
    }
    tile = selector.tilemapLocation()
    if (tiles.tileAtLocationEquals(tile, assets.tile`empty`)) {
        cannon = sprites.create(assets.image`cannon`, SpriteKind.cannon)
        tiles.placeOnTile(cannon, tile)
        tiles.setTileAt(tile, assets.tile`placed`)
        cannon.z = 3
        sprites.setDataNumber(cannon, "frames_since_fired", 390)
        sprites.setDataNumber(cannon, "time_between_fire", 400)
        sprites.setDataNumber(cannon, "level", 1)
        make_level_text(1, cannon)
        info.changeScoreBy(-100)
    }
}
sprites.onOverlap(SpriteKind.Enemy, SpriteKind.trap, function (sprite, otherSprite) {
    tiles.setTileAt(otherSprite.tilemapLocation(), assets.tile`empty`)
    sprites.destroy(otherSprite)
    bar = statusbars.getStatusBarAttachedTo(StatusBarKind.EnemyHealth, sprite)
    bar.value += -1
})
function buy_trap () {
    if (info.score() >= 50) {
        tile = selector.tilemapLocation()
        if (tiles.tileAtLocationEquals(tile, assets.tile`empty`)) {
            trap = sprites.create(assets.image`lava`, SpriteKind.trap)
            tiles.placeOnTile(trap, tile)
            tiles.setTileAt(tile, assets.tile`placed`)
            cannon.z = -1
            info.changeScoreBy(-50)
        }
    }
}
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function (cannon_ball, enemy) {
    bar = statusbars.getStatusBarAttachedTo(StatusBarKind.EnemyHealth, enemy)
    bar.value += -1
    cannon_ball.destroy()
})
function spawn_enemy () {
    enemy = sprites.create(assets.image`ghost`, SpriteKind.Enemy)
    tiles.placeOnRandomTile(enemy, assets.tile`spawn`)
    enemy.vx = -7
    bar = statusbars.create(16, 4, StatusBarKind.EnemyHealth)
    bar.max = health
    bar.value = health
    bar.setColor(4, 2)
    bar.attachToSprite(enemy)
    timer.after(spawn_frequency, function () {
        spawn_enemy()
    })
}
function make_level_text (level: number, cannon: Sprite) {
    level_text = textsprite.create(convertToText(level), 15, 1)
    level_text.setPosition(cannon.x - 5, cannon.y + 4)
    level_text.z = 4
    sprites.setDataSprite(cannon, "level_text", level_text)
}
function fire_control () {
    for (let value of sprites.allOfKind(SpriteKind.cannon)) {
        sprites.changeDataNumberBy(value, "frames_since_fired", 1)
        count = sprites.readDataNumber(value, "frames_since_fired")
        if (count > sprites.readDataNumber(value, "time_between_fire")) {
            fire(value)
        }
    }
}
let count = 0
let level_text: TextSprite = null
let enemy: Sprite = null
let trap: Sprite = null
let bar: StatusBarSprite = null
let cannon: Sprite = null
let cannons: Sprite[] = []
let tile: tiles.Location = null
let ball: Sprite = null
let limit = 0
let selector: Sprite = null
let item_selected = ""
let spawn_frequency = 0
let health = 0
health = 0
spawn_frequency = 7200
item_selected = "cannon"
info.setScore(500)
tiles.setCurrentTilemap(tilemap`level`)
scene.centerCameraAt(96, 64)
selector = sprites.create(assets.image`selector`, SpriteKind.Player)
selector.setStayInScreen(true)
selector.z = 5
grid.snap(selector)
grid.moveWithButtons(selector)
timer.after(100, function () {
    spawn_enemy()
})
game.onUpdate(function () {
    fire_control()
})
game.onUpdateInterval(20000, function () {
    health = Math.constrain(health + 1, 0, 20)
    spawn_frequency = Math.constrain(spawn_frequency - 100, -200, 10000)
})
