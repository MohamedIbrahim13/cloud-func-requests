var app = new Vue({
  el: '#app',
  data: {
    requests: [],
  },
  methods:{
    upvoteRequest(id){
      const upvote = firebase.functions().httpsCallable('upvote');
      upvote({id}).catch(error=>{
        showNotification(error.message)
      })
    }
  },
  mounted() {
    const db  = firebase.firestore().collection('requests').orderBy('upvotes','desc');
    db.onSnapshot(snapshot=>{
        const requests = [];
        snapshot.forEach(doc=>{
            requests.push({...doc.data(),id:doc.id})
        });
        this.requests = requests;
    });
  }
});