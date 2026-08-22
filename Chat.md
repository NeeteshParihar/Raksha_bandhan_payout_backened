 
i want to create raksha bandhan payout app, in this application sister will take a quiz, set by brother each question will contribute to total amount to be payout to sister,
the app will work in following way
A. Flow
1.  brother will login and add the phone number of their sister
2. this will create a database user for sister
3. now brother will hit send button on the dashboard, this will create a url   baseUrl/encryptedString
4. the encryptedString contains the phone number which is encrypted
5. this link will be send to sister phone number using sms
6. sister will go to this link
7. the backened will validate the phone number Note to enhance security we can add otp login here though i don't think its needed ( need opinion )
8. then the sister quiz is fetched from backened
9. the quiz is statefull, i.e the after attempting each question the record will be saved in database only one attempt per question will be given here
10. if sister refreshes the quiz and its state will be fetched from database directly  so its convinient
11. the statefull quiz is used to give realtime reaction to sister like emojis and cute faces
12. the answers will not be shared to frontend before attempting the question
13. as the quiz will be complete there will be a total score which  is total money they will get be will show this here but  we will keep the score in backened so that user can't modify the score
14. then the we will ask sister to provide there upiId, 
15. we will send the money to this upi Id, after required security checks and validatity


## Identities

A. User

1. role : as brother/sister
2. Name
3. quizId: Id of the  quiz, each sister will have quizId, and brother quizId will act as fallback quiz in case a sister don't get personalised quiz
4. required other attributes etc

B. Quiz
1. quizId
2. Array containing the quiz
3. other attribute ( need opinion )

c. QuizQuestion
1. Id,
2. question description
3. type of question like mcq, or input based
4. score 
5. userId : the quiz created 
6. targetUserID: the quizFor  for who this quiz is  ( need opinion)
8. other params

d. payout
1. transferedAmount
2. date
3. status: like failed, completed etc
4. UserId:  which user gets the amount


