// Mendapatkan referensi socket.io dari server
const socket = io();

// Mendapatkan elemen dari HTML
const $messageForm = document.querySelector('#form-pesan');
const $messageFormInput = document.querySelector('input[name=pesan]');
const $messageFormButton = document.querySelector('button');
const $sendLocationButton = document.querySelector('#kirim-lokasi');
const $messages = document.querySelector('#messages');

// Mendapatkan template dari HTML
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#locationMessage-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Mendapatkan data username dan room dari URL
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

// Fungsi untuk otomatis meng-scroll pesan ke bawah
const autoScroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild;

    // Tinggi pesan baru
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // Tinggi yang terlihat
    const visibleHeight = $messages.offsetHeight;

    // Tinggi container pesan
    const containerHeight = $messages.scrollHeight;

    // Sejauh apa pesan telah di-scroll
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

// Mendengarkan event 'pesan' dari server
socket.on('pesan', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('H:mm')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

// Mendengarkan event 'locationMessage' dari server
socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('H:mm')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();
});

// Mendengarkan event 'roomData' dari server
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    document.querySelector('#sidebar').innerHTML = html;
});

// Menangani submit form pesan
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled');

    const pesan = e.target.elements.pesan.value;
    socket.emit('kirimPesan', pesan, (error) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }
        console.log('Pesan berhasil dikirim');
    });
});

// Menangani klik tombol kirim lokasi
$sendLocationButton.addEventListener('click', (e) => {
    if (!navigator.geolocation) {
        return alert('Browser anda tidak mendukung Geolocation');
    }

    $sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('kirimLokasi', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute('disabled');
            console.log('Lokasi berhasil dikirim');
        });
    });
});

// Mengirim data username dan room ke server untuk bergabung ke dalam room
socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/'; // Redirect ke halaman awal jika terjadi error
    }
});
