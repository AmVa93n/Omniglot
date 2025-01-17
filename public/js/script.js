document.addEventListener("DOMContentLoaded", () => {
  const languageSpans = [...document.querySelectorAll('.lang-name')];
  for (let span of languageSpans) {
      span.innerText = getLanguageName(span.innerText)
  }
  const spansToStylize = [...document.querySelectorAll('.stylize')];
  for (let span of spansToStylize) {
      span.innerHTML = stylizeText(span.innerText)
  }
  document.querySelectorAll('.rating').forEach(span => {
    let stars = parseInt(span.innerText)
    span.innerHTML = ""
    for (let i=1; i<stars+1; i++) {
      span.innerHTML += '&#9733;'
    }
  })
  const ageSpans = [...document.querySelectorAll('.age')]
  for (let span of ageSpans) span.innerText = getUserAge(span.innerText)

  const dateSpans = [...document.querySelectorAll('.date')]
  for (let span of dateSpans) span.innerText = formatDate(span.innerText)
});

function getLanguageName(langCode) {
  return langList[langCode];
}

function getLanguageCode(langName) {
  for (let code in langList) {
    if (langList[code] == langName) return code;
  }
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatDate(dateString) {
  let date = new Date(dateString);
  
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  const ordinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  return `${day}${ordinalSuffix(day)} ${month} ${year}`;
}

// convert 'yyyy/mm/dd' dates to 'dd/mm/yyyy' format
function flipDayAndYear(date) {
  var day = ('0' + date.getDate()).slice(-2);
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var year = date.getFullYear();
  return day + '-' + month + '-' + year;
}

function getUserAge(birthdate) {
  const date = new Date(birthdate);
  const today = new Date();

  let age = today.getFullYear() - date.getFullYear();
  const monthDifference = today.getMonth() - date.getMonth();
  const dayDifference = today.getDate() - date.getDate();

  if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
    age--;
  }

  return age;
}

function getMsgTime(timestamp) {
  const date = new Date(timestamp); // Parse the timestamp into a Date object
  const index = date.toLocaleTimeString()[0] == "0" ? 4 : 5 // 0 is not 00, so need to slice 1 character earlier
  return date.toLocaleTimeString().slice(0, index)
}

function getMsgDate(timestamp) {
  const date = new Date(timestamp); // Parse the timestamp into a Date object
  const day = date.getDate()
  const month = months[date.getMonth()]
  return day + " " + month
}

const langList = {
  'es': 'Spanish',
  'it': 'Italian',
  'pt': 'Portuguese',
  'fr': 'French',
  'de': 'German',
  'ru': 'Russian',
  'nl': 'Dutch',
  'zh': 'Chinese',
  'hu': 'Hungarian',
  'he': 'Hebrew',
  'ar': 'Arabic',
  'pl': 'Polish',
  'ro': 'Romanian',
  'jp': 'Japanese',
  'kr': 'Korean',
};

function stylizeText(plainText) {
  switch(plainText) {
    case "private":
      return '<i class="bi bi-person-fill me-2"></i>Private'
    case "group":
      return '<i class="bi bi-people-fill me-2"></i>Group'
    case "beginner":
      return '<i class="bi bi-mortarboard-fill me-2"></i>Beginner'
    case "intermediate":
      return '<i class="bi bi-mortarboard-fill me-2"></i>Intermediate'
    case "advanced":
      return '<i class="bi bi-mortarboard-fill me-2"></i>Advanced'
    case "online":
      return '<i class="bi bi-wifi me-2"></i>Online'
    case "at-student":
      return `<i class="bi bi-house-fill me-2"></i>At the student's home`
    case "at-teacher":
      return `<i class="bi bi-house-fill me-2"></i>At the teacher's home`
  }
}

