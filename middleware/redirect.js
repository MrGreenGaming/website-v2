// Add more redirects here
export default function ({ route, redirect }) {
  switch (route.fullPath) {
    case '/mta/toptimes':
      return redirect('/mta/toptimes/player')
    case '/toptimes':
      return redirect('/mta/toptimes/player')
    case '/greencoins':
      return redirect('/greencoins/donate')
    case '/donate':
      return redirect('/greencoins/donate')
    case '/mta':
      return redirect('/mta/leaderboards')
    case '/forums':
      return redirect('https://mrgreengaming.com/forums/')
  }
}
