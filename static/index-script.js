document.addEventListener('DOMContentLoaded', function() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    question.addEventListener('click', function() {
      const answer = this.nextElementSibling;
      const isActive = answer.classList.contains('active');
      
      // Close all other FAQ items
      document.querySelectorAll('.faq-answer').forEach(ans => {
        ans.classList.remove('active');
      });
      document.querySelectorAll('.faq-question').forEach(q => {
        q.classList.remove('active');
      });
      
      // Toggle current item
      if (!isActive) {
        answer.classList.add('active');
        this.classList.add('active');
      }
    });
  });
});