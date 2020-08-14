const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// onRequest functions

// exports.randomNumber= functions.https.onRequest((req,res)=>{
//     const number = Math.round(Math.random() * 100);
//     console.log(number);
//     res.send(number.toString());
// });

// exports.toGoogle = functions.https.onRequest((req,res)=>{
//     res.redirect('https://www.google.com');
// });

// // onCall functions

// exports.sayHello = functions.https.onCall((data,context)=>{
//     const name = data.name;
//     return `Hello,${name}`;
// });


//auth trigger onCreate
exports.newSignUp = functions.auth.user().onCreate(user=>{
    return admin.firestore().collection('users').doc(user.uid).set({
        email:user.email,
        upvotesOn: []
    });
});


//auth trigger onDelete
exports.userDelete = functions.auth.user().onDelete(user=>{
    return admin.firestore().collection('users').doc(user.uid).delete();
});

// onCall addRequest

exports.addRequest = functions.https.onCall((data,context)=>{
    if(!context.auth){
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Not permitted user'
        );
    }
    if(data.text.length > 30 ){
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Request must not be more than 30 characters long'
        );
    }
    return admin.firestore().collection('requests').add({
        text:data.text,
        upvotes:0
    });
});

// onCall upvotes
exports.upvote = functions.https.onCall(async (data, context) => {
  // check auth state
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 
      'Not permitted user'
    );
  }
  // get refs for user doc & request doc
  const user = admin.firestore().collection('users').doc(context.auth.uid);
  const request = admin.firestore().collection('requests').doc(data.id);

  const doc = await user.get()
  // check thew user hasn't already upvoted
  if(doc.data().upvotesOn.includes(data.id)){
    throw new functions.https.HttpsError(
      'failed-precondition', 
      'You can only vote once'
    );
  }

  // update the array in user document
  await user.update({
    upvotesOn: [...doc.data().upvotesOn, data.id]
  })

  // update the votes on the request
  await request.update({
    upvotes: admin.firestore.FieldValue.increment(1)
  });
 
});

exports.logActivity = functions.firestore.document('/{collection}/{id}').onCreate((snap,context)=>{
  const collection = context.params.collection;
  const activities = admin.firestore().collection('activities');
  if(collection === 'requests'){
    return activities.add({text: 'A new course has been added'});
  }
  if(collection === 'users'){
    return activities.add({text: 'A new user has been created'});
  }
  return null;
});