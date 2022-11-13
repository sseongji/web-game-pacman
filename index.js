//== const canvas = document.querySelector('canvas')
const canvas = document.getElementById('mycanvas')
// console.log(canvas)
const c= canvas.getContext('2d')

const scoreEl = document.getElementById('scoreEl')
// console.log(scoreEl)

//창 크기
canvas.width = innerWidth
canvas.height = innerHeight

//지도 파이프 경계, 정사각형 하나
class Boundary{
    //정적 프로퍼티, (너비 고정)
    static width = 40
    static height = 40
    //생성자
    constructor({position}){ //position(속성), (+속도)
        //위치속성, position:{x, y} - 동적으로 x, y 위치 잡기
        this.position = position
        this.width = 40
        this.height = 40 //정사각형

        // console.log(position)
    }

    //정사각형 그리기
    draw(){
        c.fillStyle ='blue'
        //x, y, width, height
        c.fillRect(this.position.x, this.position.y, this.width, this.height)
    }
}

//player, 팩맨
class Player{
    constructor({position, velocity}){
        this.position = position    //위치
        this.velocity = velocity    //속도, 이동하므로
        this.radius = 15    //원형모양 캐릭터 반경(px)
        this.radians = 0.75 //팩맨 입
        this.openRate = 0.12
        // this.rotation = 0
    }

    draw(){
        c.save() //저장
        // c.translate(this.position.x, this.position.y) //회전 기준점
        // c.rotate(this.rotation) //회전
        // c.translate(this.position.x, -this.position.y) //회전 기준점

        //beginPath에서 closePath까지, 열거나 닫지 않으면 연결되어 그려짐
        c.beginPath()
        // c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
        c.arc(this.position.x, this.position.y, this.radius, this.radians, Math.PI * 2 - this.radians)
        c.lineTo(this.position.x, this.position.y)
        c.fillStyle = 'yellow'
        c.fill()
        c.closePath()
        c.restore() //복원
    }
    //velocity가 변경될 때(이동)마다 위치 업데이트
    update(){
        this.draw()
        //위치 + 이동
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        if(this.radians < 0 || this.radians > .75){
            this.openRate = -this.openRate
        }
        this.radians += this.openRate
    }
}

//ghost, 유령
class Ghost{
    static speed = 2
    constructor({position, velocity, color='red'}){
        this.position = position    //위치
        this.velocity = velocity    //속도, 이동하므로
        this.radius = 15    //원형모양 캐릭터 반경(px)
        this.color = color //동적인 색상
        this.prevCollisions = [] //이전 충돌상태
        this.speed = 2
    }

    draw(){
        //beginPath에서 closePath까지, 열거나 닫지 않으면 연결되어 그려짐
        c.beginPath()
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
        c.fillStyle = this.color
        c.fill()
        c.closePath()
    }
    //velocity가 변경될 때(이동)마다 위치 업데이트
    update(){
        this.draw()
        //위치 + 이동
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
    }
}

//pellet, 펠릿(점수아이템)
class Pellet{
    constructor({position}){
        this.position = position    //위치
        this.radius = 3    //원형모양 아이템 반경(px)
    }

    draw(){
        //beginPath에서 closePath까지, 열거나 닫지 않으면 연결되어 그려짐
        c.beginPath()
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
        c.fillStyle = 'white'
        c.fill()
        c.closePath()
    }
}

//pellet 배열
const pellets = []
//boundary 배열, (요소 1개 = 정사각형 1개)
const boundaries = []
//ghost 배열
const ghosts = [
    new Ghost({
        position:{
            x: Boundary.width * 6 + Boundary.width/2,  
            y: Boundary.height + Boundary.height/2
        },
        velocity:{
            x:Ghost.speed,
            y:0
        }
    }),
    new Ghost({
        position:{
            x: Boundary.width * 6 + Boundary.width/2,  
            y: Boundary.height * 3 + Boundary.height/2
        },
        velocity:{
            x:Ghost.speed,
            y:0
        },
        color : 'pink'
    })
]
const player = new Player({
    position: {
        //(40+20), 빈공간 가운데 중심점
        x: Boundary.width + Boundary.width/2,  
        y: Boundary.height + Boundary.height/2
    },
    velocity: {
        x:0,
        y:0
    }
})

//키입력 boolean값, 동시입력 처리
const keys ={
    up:{
        pressed:false
    },
    left:{
        pressed:false
    },
    down:{
        pressed:false
    },
    right:{
        pressed:false
    }
}

//(6*4)요소 1개 = 상자 1개
//- : 상자만듬
const map =[
    ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'],
    ['-', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '-'],
    ['-', ' ', '-', ' ', '-', '-', '-', ' ', '-', ' ', '-'],
    ['-', ' ', ' ', ' ', ' ', '-', ' ', ' ', ' ', ' ', '-'],
    ['-', ' ', '-', '-', ' ', ' ', ' ', '-', '-', ' ', '-'],
    ['-', ' ', ' ', ' ', ' ', '-', ' ', ' ', ' ', ' ', '-'],
    ['-', ' ', '-', ' ', '-', '-', '-', ' ', '-', ' ', '-'],
    ['-', ' ', ' ', ' ', ' ', '-', ' ', ' ', ' ', ' ', '-'],
    ['-', ' ', '-', '-', ' ', ' ', ' ', '-', '-', ' ', '-'],
    ['-', ' ', ' ', ' ', ' ', '-', ' ', ' ', ' ', ' ', '-'],
    ['-', ' ', '-', ' ', '-', '-', '-', ' ', '-', ' ', '-'],
    ['-', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '-'],
    ['-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']
]

//마지막 입력키값
let lastKey = ''
//점수
let score = 0

//(행) 
map.forEach((row, i)=>{
    //(열)행 하나의 요소 한 개
    row.forEach((symbol, j) =>{
        // console.log(symbol)
        switch (symbol){
            case '-':
                boundaries.push(
                    new Boundary({
                        position:{
                            x: Boundary.width * j, //가로
                            y: Boundary.height * i  //세로
                        }
                    })
                )
                break
            case ' ':
                pellets.push(
                    new Pellet({
                        position:{
                            x: Boundary.width * j + Boundary.width/2, //가로
                            y: Boundary.height * i + Boundary.height/2  //세로
                        }
                    })
                )
        }
    })
})

//플레이어-경계(원-사각형)충돌 확인
//(p-top <= b-bottom) ,(p-right >= b-left), (p-bottom >= b-top), (p-left <= b-right)
function circleCollidesWithRect({circle, rect}){
    const padding = Boundary.width/2 - circle.radius -1
    return (
        circle.position.y - circle.radius + circle.velocity.y <= rect.position.y + rect.height + padding
        && circle.position.x + circle.radius + circle.velocity.x >= rect.position.x - padding
        && circle.position.y + circle.radius + circle.velocity.y >= rect.position.y - padding
        && circle.position.x - circle.radius + circle.velocity.x <= rect.position.x + rect.width +padding
    )
}

//애니메이션 프레임 상태
let animationId

function animate(){
    //무한루프, 애니메이션 리페인트
    animationId = requestAnimationFrame(animate)
    //초기화
    c.clearRect(0 ,0 ,canvas.width, canvas.height)

    //마지막 입력키 기준으로 움직임
    if(keys.up.pressed && lastKey ==='up'){
        // player.velocity.y = -5
        // boundaries.forEach(boundary =>{ //break 안됨
        for(let i =0; i< boundaries.length; i++){
            const boundary = boundaries[i]
            //예측!! 프레임 넘기기 전에 충돌할 것인지 예상 가능함.
            if(circleCollidesWithRect({
                //현재 플레이어 복사
                circle:{
                    ...player,
                    velocity: {
                    x: 0,
                    y: -5
                    }
                },
                rect:boundary
            })
            ){
                //충돌하면
                player.velocity.y = 0
                break
            }else{
                //충돌안하면
                player.velocity.y = -5
            }
        }
    }else if(keys.left.pressed && lastKey ==='left'){
        for(let i =0; i< boundaries.length; i++){
            const boundary = boundaries[i]
            //예측!! 프레임 넘기기 전에 충돌할 것인지 예상 가능함.
            if(circleCollidesWithRect({
                //현재 플레이어 복사
                circle:{
                    ...player,
                    velocity: {
                    x: -5,
                    y: 0
                    }
                },
                rect:boundary
            })
            ){
                //충돌하면
                player.velocity.x = 0
                break
            }else{
                //충돌안하면
                player.velocity.x = -5
            }
        }
    }else if(keys.down.pressed && lastKey ==='down'){
        for(let i =0; i< boundaries.length; i++){
            const boundary = boundaries[i]
            //예측!! 프레임 넘기기 전에 충돌할 것인지 예상 가능함.
            if(circleCollidesWithRect({
                //현재 플레이어 복사
                circle:{
                    ...player,
                    velocity: {
                    x: 0,
                    y: 5
                    }
                },
                rect:boundary
            })
            ){
                //충돌하면
                player.velocity.y = 0
                break
            }else{
                //충돌안하면
                player.velocity.y = 5
            }
        }
    }else if(keys.right.pressed && lastKey ==='right'){
        for(let i =0; i< boundaries.length; i++){
            const boundary = boundaries[i]
            //예측!! 프레임 넘기기 전에 충돌할 것인지 예상 가능함.
            if(circleCollidesWithRect({
                //현재 플레이어 복사
                circle:{
                    ...player,
                    velocity: {
                    x: 5,
                    y: 0
                    }
                },
                rect:boundary
            })
            ){
                //충돌하면
                player.velocity.x = 0
                break
            }else{
                //충돌안하면
                player.velocity.x = 5
            }
        }
    }

    //펠릿 그리기 및 처리
    //거꾸로(렌더링 문제 해결), 앞에서부터 자르면 다음요소 인덱스 달라짐.
    for(let i = pellets.length -1; 0 < i; i--){
        const pellet = pellets[i]
        
        pellet.draw()

        if(Math.hypot(
            pellet.position.x - player.position.x,
            pellet.position.y - player.position.y)
            < (pellet.radius + player.radius)
        ){
            // console.log('touching')
            pellets.splice(i, 1)
            score += 10
            scoreEl.innerHTML = score
        }
    }

    //경계타일 그리기
    boundaries.forEach(boundary =>{
        boundary.draw()
        if(
            circleCollidesWithRect({
                circle:player, 
                rect:boundary
            })
        ){
            // console.log('we are colliding')
            //충돌하면 정지
            player.velocity.x=0
            player.velocity.y=0
        }
    })

    player.update()

    // console.log('frame')
    //keyup하면 멈추도록
    // player.velocity.x=0
    // player.velocity.y=0

    //충돌기반 움직임!!, 충돌하지 않는 방향으로
    ghosts.forEach(ghost =>{
        ghost.update()

        //사용자-유령 충돌 처리
        if(Math.hypot(
            ghost.position.x - player.position.x,
            ghost.position.y - player.position.y)
            < (ghost.radius + player.radius)
        ){
            cancelAnimationFrame(animationId)
            console.log('you lose')
        }

        //승리조건처리, 펠릿 다 먹으면
        if(pellets.length === 0){
            console.log('you win')
            cancelAnimationFrame(animationId)
        }

        const collisions = []
        //충돌 가능 위치 체크
        boundaries.forEach(boundary=>{
            //오른쪽
            if(!collisions.includes('right') && //중복삽입 방지
                circleCollidesWithRect({
                //현재 유령 복사
                circle:{
                    ...ghost,
                    velocity: {
                    x: ghost.speed,
                    y: 0
                    }
                },
                rect:boundary
            })
            ){
                collisions.push('right')
            }
            //왼쪽
            if(!collisions.includes('left') &&
                circleCollidesWithRect({
                circle:{
                    ...ghost,
                    velocity: {
                    x: -ghost.speed,
                    y: 0
                    }
                },
                rect:boundary
            })
            ){
                collisions.push('left')
            }
            //위쪽
            if(!collisions.includes('up') &&
                circleCollidesWithRect({
                circle:{
                    ...ghost,
                    velocity: {
                    x: 0,
                    y: -ghost.speed
                    }
                },
                rect:boundary
            })
            ){
                collisions.push('up')
            }
            //아래쪽
            
            if(!collisions.includes('down') &&
                circleCollidesWithRect({
                circle:{
                    ...ghost,
                    velocity: {
                    x: 0,
                    y: ghost.speed
                    }
                },
                rect:boundary
            })
            ){
                collisions.push('down')
            }
        })
        // 충돌하고 있음
        if(collisions.length > ghost.prevCollisions.length)
            ghost.prevCollisions = collisions
        if(JSON.stringify(collisions) !== JSON.stringify(ghost.prevCollisions)){
            // console.log('go')
                
            if(ghost.velocity.x > 0)
                ghost.prevCollisions.push('right')
            else if(ghost.velocity.x < 0)
                ghost.prevCollisions.push('left')
            else if(ghost.velocity.y < 0)
                ghost.prevCollisions.push('up')
            else if(ghost.velocity.y > 0)
                ghost.prevCollisions.push('down')

            // console.log(collisions)
            // console.log(ghost.prevCollisions)
            
            const pathways = ghost.prevCollisions.filter(collision=>{
                return !collisions.includes(collision)
            })
            // console.log({pathways})
            const direction = pathways[Math.floor(Math.random() * pathways.length)] //소수점 내림
        
            // console.log({direction})

            switch(direction){
                case 'down':
                    ghost.velocity.y = ghost.speed
                    ghost.velocity.x = 0
                    break
                case 'up':
                    ghost.velocity.y = -ghost.speed
                    ghost.velocity.x = 0
                    break
                case 'right':
                    ghost.velocity.y = 0
                    ghost.velocity.x = ghost.speed
                    break
                case 'left':
                    ghost.velocity.y = 0
                    ghost.velocity.x = -ghost.speed
                    break
            }
            ghost.prevCollisions=[] //방향 결정하면 초기화
        }
        // console.log(collisions)

    })  

    // if(player.velocity.x > 0) player.rotation = 0
    // else if(player.velocity.x < 0) player.rotation = Math.PI
    // else if(player.velocity.y < 0) player.rotation = Math.PI / 2
    // else if(player.velocity.y < 0) player.rotation = Math.PI * 1.5


} //end of animate()

animate()


//player 키다운 이벤트처리, event:key
//==window.addEventListener
addEventListener('keydown', ({key})=>{
    // console.log(key)
    switch (key){
        case 'w': case 'ArrowUp':    //위
            // player.velocity.y =-5
            keys.up.pressed = true
            lastKey = 'up'
            break
        case 'a': case 'ArrowLeft': //왼
            keys.left.pressed = true
            lastKey = 'left'

        break
        case 's': case 'ArrowDown': //아래
            keys.down.pressed = true
            lastKey = 'down'

        break
        case 'd': case 'ArrowRight': //오
            keys.right.pressed = true
            lastKey = 'right'
            // console.log(keys.own.pressed)
        break
    }
    // console.log(player.velocity)
}) 

//player 키업 이벤트처리, 직선으로 이동할 수 있도록
addEventListener('keyup', ({key})=>{
    // console.log(key)
    switch (key){
        case 'w': case 'ArrowUp':    //위
            // player.velocity.y =0
            keys.up.pressed = false
            break
        case 'a': case 'ArrowLeft': //왼
            keys.left.pressed = false

        break
        case 's': case 'ArrowDown': //아래
            keys.down.pressed = false

        break
        case 'd': case 'ArrowRight': //오
            keys.right.pressed = false
        break
    }
    // console.log(player.velocity)
}) 



// if(canvas.getContext){
//     //canvas 지원하는 경우
//     const c= canvas.getContext('2d')

// }else{
//     //canvas가 지원되지 않을 경우!!
// }