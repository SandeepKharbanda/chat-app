const socket = io()

//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarMessageTemplate = document.querySelector('#sidebar-template').innerHTML

//Options for eg: ?username=Sandy&room=South+Philly in http://localhost:3000/chat.html?username=Sandy&room=South+Philly
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

const autoscroll = () => {
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin // 60

    //visibile Height i.e actual height
    const visibileHeight = $messages.offsetHeight //98

    //visibile of message container
    const containerHeight = $messages.scrollHeight //564

    //How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibileHeight //406(scrolltop) + 98 = 504
    console.log(`newMessageHeight ${newMessageHeight}, visibileHeight ${visibileHeight}, containerHeight ${containerHeight}, $messages.scrollTop ${$messages.scrollTop}`)

    if(containerHeight - newMessageHeight <= scrollOffset) { //(564-60) <= 504
        $messages.scrollTop = $messages.scrollHeight //564
    }

}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('countUpdated', (count)=> {
    console.log('The count has been updated!', count)
})

// document.querySelector('#increment').addEventListener('click', ()=> {
//     console.log('clicked')
//     socket.emit('increment')
// })

$messageForm.addEventListener('submit', (event) => {
    event.preventDefault()
    const message = event.target.elements.message
    $messageFormButton.setAttribute('disabled', 'disabled')
    socket.emit('sendMessage', message.value, (message) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        console.log(message)
    })
})

// document.querySelector('#increment').addEventListener('click', ()=> {
//     console.log('clicked')
//     socket.emit('increment')
// })

$sendLocationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }
    $sendLocationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position)
        const latitude  = position.coords.latitude;
        const longitude = position.coords.longitude;
        socket.emit('sendLocation', {latitude, longitude}, (message) => {
            $sendLocationButton.removeAttribute('disabled')
            console.log(message)
        })
    });
});

socket.emit('join', {username, room}, (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})

socket.on('roomData', ({room, users}) => {
    console.log("users", users)
    const html = Mustache.render(sidebarMessageTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

