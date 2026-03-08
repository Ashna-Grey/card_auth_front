async function analyze(){
const fileInput = document.getElementById("fileInput")
if(fileInput.files.length === 0){
alert("Please upload a CSV file")
return
}
const file = fileInput.files[0]
const formData = new FormData()
formData.append("file", file)
document.getElementById("status").innerText = "Analyzing..."
try{
const response = await fetch(
"https://card-auth-updated.onrender.com/analyze",
{
method:"POST",
body:formData
}
)
const data = await response.json()
displayResults(data)
}catch(error){
document.getElementById("status").innerText = "Server error"
}
}
function displayResults(data){
const tableBody = document.querySelector("#resultTable tbody")
tableBody.innerHTML = ""
document.getElementById("status").innerText =
"Total Cards Analyzed: " + data.total_cards_analyzed
if(data.suspicious_cards.length === 0){
tableBody.innerHTML =
"<tr><td colspan='7'>No suspicious cards detected</td></tr>"
return
}
data.suspicious_cards.forEach(card => {
let row = document.createElement("tr")
if(card.risk_level === "HIGH"){
row.className = "high"
}
if(card.risk_level === "MEDIUM"){
row.className = "medium"
}
row.innerHTML = `
<td>${card.card_number}</td>
<td>${card.transactions}</td>
<td>${card.unique_ips}</td>
<td>${card.time_span_minutes}</td>
<td>${card.risk_score}</td>
<td>${card.risk_level}</td>
<td>${card.reason}</td>
`
tableBody.appendChild(row)
})
}
