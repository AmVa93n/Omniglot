const notifList = document.getElementById('notifList')
const unreadCount = document.getElementById("unreadCount")
if (unreadCount.innerText > 0) unreadCount.style.display = 'block'
updateNotifBorder()

function createNotif(notifData) {
    const newNotif = document.createElement('li')
    newNotif.classList.add("notif")
    newNotif.id = notifData._id
    let profilePicSrc = notifData.source.profilePic ? `${notifData.source.profilePic}` : "/images/Profile-PNG-File.png"
    let notifText 
    switch(notifData.type) {
        case "review": notifText = " has left a review about your class"; break
        case "booking": notifText = " has booked a class with you"; break
        case "message": notifText = " has sent you a message"; break
        case "clone": notifText = " has cloned one of your decks"; break
        case "cancel-teacher":
        case "cancel-student": notifText = " has cancelled your class"; break
        case "reschedule-teacher-pending":
        case "reschedule-student-pending": notifText = " has requested to reschedule your class"; break
        case "reschedule-teacher-accept":
        case "reschedule-student-accept": notifText = " has accepted your reschedule request"; break
        case "reschedule-teacher-decline":
        case "reschedule-student-decline": notifText = " has declined your reschedule request"; break
    }
    newNotif.innerHTML = 
        `<div class="dropdown-item gap-2 py-2 position-relative" onclick="readNotif('${notifData._id}','${notifData.type}')" style="background-color: rgb(227, 242, 253);">
            <div class="d-flex align-items-center mb-1">
                <div class="circle-crop nav-item me-1" style="width:25px;height:25px;display:inline-flex">
                <img src=${profilePicSrc}>
                </div>
                <span><span class="fw-bold">${notifData.source.username}</span>${notifText}</span>
            </div>
            <small style="width: fit-content;" class="d-block ms-auto">${notifData.timeDiff}</small>
            <button class="btn position-absolute top-0 end-0 p-0" onclick="deleteNotif('${notifData._id}', event)"><i class="bi bi-x"></i></button>
        </div>`
    notifList.insertBefore(newNotif, notifList.firstChild)
    unreadCount.innerText ++
    if (unreadCount.innerText > 0) unreadCount.style.display = 'block'
    updateNotifBorder()
}

async function readNotif(notifId, type) {
    let redirectUrl
    switch(type) {
        case 'message': redirectUrl = '/account/inbox' ;break
        case 'review': redirectUrl = '/account/reviews' ;break
        case 'clone': redirectUrl = '/account/decks' ;break
        case 'booking':
        case 'cancel-student':
        case "reschedule-student-accept":
        case "reschedule-student-decline":
        case "reschedule-student-pending": redirectUrl = '/account/calendar' ;break
        case 'cancel-teacher': 
        case "reschedule-teacher-accept":
        case "reschedule-teacher-decline":
        case "reschedule-teacher-pending": redirectUrl = '/account/classes' ;break
    }
    const response = await fetch('/notification/read', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notifId }),
    });
    if (response.ok) window.location.href = `${redirectUrl}`;
}

async function deleteNotif(notifId, event) {
    event.stopPropagation();
    await fetch('/notification/delete', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notifId }),
    });
    document.getElementById(notifId).remove()
}

function updateNotifBorder() {
    [...notifList.children].forEach(el => {
        if (el != notifList.lastElementChild) el.style.borderBottom = "solid 0.8px rgb(222, 226, 230)"
    })
}