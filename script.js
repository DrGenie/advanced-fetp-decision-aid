/****************************************************************************
 * SCRIPT.JS
 * Advanced FETP Decision Aid Tool
 * - Tab switching, slider updates, and accordion toggling
 * - DCE model for Advanced FETP with updated attribute coefficients
 * - Chart rendering for Adoption Likelihood and dynamic cost–benefit analysis
 * - Scenario saving & PDF export
 * - FAQ overlay with detailed explanations
 ****************************************************************************/

/* Global variables */
var leafletMap;
var probChartFETP = null;
var costBenefitChart = null;

/* Updated DCE Coefficients for Advanced FETP */
var mainCoefficients = {
  base: -0.1,
  delivery_inperson: 0.3,
  delivery_hybrid: 0.5,
  delivery_online: 0,
  capacity_500: 0,
  capacity_1000: 0.2,
  capacity_2000: 0.4,
  stipend_75000: 0,
  stipend_100000: 0.2,
  stipend_150000: 0.4,
  career_government: 0,
  career_international: 0.3,
  career_academic: 0.2,
  career_private: 0.1,
  accreditation_unaccredited: -0.5,
  accreditation_national: 0.2,
  accreditation_international: 0.5,
  cost_low: 0.5,
  cost_medium: 0,
  cost_high: -0.5
};

/* Tab Switching */
document.addEventListener("DOMContentLoaded", function() {
  var tabs = document.querySelectorAll(".tablink");
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener("click", function() {
      openTab(this.getAttribute("data-tab"), this);
    });
  }
  openTab("introTab", tabs[0]);
  
  // Accordions for cost breakdown and benefits explanation
  var accordions = document.querySelectorAll(".accordion-item h3");
  for (var j = 0; j < accordions.length; j++) {
    accordions[j].addEventListener("click", function() {
      var content = this.nextElementSibling;
      content.style.display = (content.style.display === "block") ? "none" : "block";
    });
  }
});

/* Open Tab Function */
function openTab(tabId, clickedBtn) {
  var contents = document.getElementsByClassName("tabcontent");
  for (var i = 0; i < contents.length; i++) { contents[i].style.display = "none"; }
  var buttons = document.getElementsByClassName("tablink");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].classList.remove("active");
    buttons[i].setAttribute("aria-selected", "false");
  }
  document.getElementById(tabId).style.display = "block";
  clickedBtn.classList.add("active");
  clickedBtn.setAttribute("aria-selected", "true");
}

/* Build Scenario */
function buildFETPScenario() {
  var deliveryMethod = document.querySelector('input[name="deliveryMethod"]:checked') ? document.querySelector('input[name="deliveryMethod"]:checked').value : null;
  var annualCapacity = document.querySelector('input[name="annualCapacity"]:checked') ? document.querySelector('input[name="annualCapacity"]:checked').value : null;
  var stipendSupport = document.querySelector('input[name="stipendSupport"]:checked') ? document.querySelector('input[name="stipendSupport"]:checked').value : null;
  var careerPathway = document.querySelector('input[name="careerPathway"]:checked') ? document.querySelector('input[name="careerPathway"]:checked').value : null;
  var accreditation = document.querySelector('input[name="accreditation"]:checked') ? document.querySelector('input[name="accreditation"]:checked').value : null;
  var totalCost = document.querySelector('input[name="totalCost"]:checked') ? document.querySelector('input[name="totalCost"]:checked').value : null;
  if(!deliveryMethod || !annualCapacity || !stipendSupport || !careerPathway || !accreditation || !totalCost) return null;
  return {
    deliveryMethod: deliveryMethod,
    annualCapacity: annualCapacity,
    stipendSupport: stipendSupport,
    careerPathway: careerPathway,
    accreditation: accreditation,
    totalCost: totalCost
  };
}

/* Compute Uptake using logistic function */
function computeFETPUptake(sc) {
  var U = mainCoefficients.base;
  // Delivery Method
  if (sc.deliveryMethod === "inperson") U += mainCoefficients.delivery_inperson;
  else if (sc.deliveryMethod === "hybrid") U += mainCoefficients.delivery_hybrid;
  else if (sc.deliveryMethod === "online") U += mainCoefficients.delivery_online;
  // Annual Capacity
  if (sc.annualCapacity === "500") U += mainCoefficients.capacity_500;
  else if (sc.annualCapacity === "1000") U += mainCoefficients.capacity_1000;
  else if (sc.annualCapacity === "2000") U += mainCoefficients.capacity_2000;
  // Stipend Support
  if (sc.stipendSupport === "75000") U += mainCoefficients.stipend_75000;
  else if (sc.stipendSupport === "100000") U += mainCoefficients.stipend_100000;
  else if (sc.stipendSupport === "150000") U += mainCoefficients.stipend_150000;
  // Career Pathways
  if (sc.careerPathway === "government") U += mainCoefficients.career_government;
  else if (sc.careerPathway === "international") U += mainCoefficients.career_international;
  else if (sc.careerPathway === "academic") U += mainCoefficients.career_academic;
  else if (sc.careerPathway === "private") U += mainCoefficients.career_private;
  // Accreditation
  if (sc.accreditation === "unaccredited") U += mainCoefficients.accreditation_unaccredited;
  else if (sc.accreditation === "national") U += mainCoefficients.accreditation_national;
  else if (sc.accreditation === "international") U += mainCoefficients.accreditation_international;
  // Total Cost
  if (sc.totalCost === "low") U += mainCoefficients.cost_low;
  else if (sc.totalCost === "medium") U += mainCoefficients.cost_medium;
  else if (sc.totalCost === "high") U += mainCoefficients.cost_high;
  
  var uptakeProbability = Math.exp(U) / (Math.exp(U) + 1);
  return uptakeProbability;
}

/* Open Results Modal */
function openFETPScenario() {
  var scenario = buildFETPScenario();
  if (!scenario) { alert("Please select all required fields before calculating."); return; }
  var fraction = computeFETPUptake(scenario);
  var pct = fraction * 100;
  var recommendation = (pct < 30) ? "Uptake is low. Consider revising features." :
                        (pct < 70) ? "Uptake is moderate. Some adjustments may boost support." :
                                     "Uptake is high. This configuration is promising.";
  var modalHTML = "<h4>Calculation Results</h4>" +
                  "<p><strong>Predicted Uptake:</strong> " + pct.toFixed(2) + "%</p>" +
                  "<p><em>Recommendation:</em> " + recommendation + "</p>";
  document.getElementById("modalResults").innerHTML = modalHTML;
  document.getElementById("resultModal").style.display = "block";
  renderFETPProbChart();
  renderFETPCostsBenefits();
  renderCostBenefitChart();
}

/* Close Modal */
function closeModal() {
  document.getElementById("resultModal").style.display = "none";
}

/* Render Adoption Likelihood Chart */
function renderFETPProbChart() {
  var scenario = buildFETPScenario();
  if (!scenario) { alert("Please select all required fields first."); return; }
  var fraction = computeFETPUptake(scenario);
  var pct = fraction * 100;
  var ctx = document.getElementById("probChartFETP").getContext("2d");
  if (probChartFETP) probChartFETP.destroy();
  probChartFETP = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Adoption", "Non-adoption"],
      datasets: [{ data: [pct, 100 - pct], backgroundColor: ["#28a745", "#dc3545"] }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { animateScale: true, animateRotate: true },
      plugins: { title: { display: true, text: "Adoption Likelihood: " + pct.toFixed(2) + "%", font: { size: 16 } } }
    }
  });
}

/* Render Cost–Benefit Analysis & Dynamic Cost Estimation */
function renderFETPCostsBenefits() {
  var scenario = buildFETPScenario();
  if (!scenario) {
    document.getElementById("costsFETPResults").innerHTML = "<p>Please select all inputs before computing costs.</p>";
    return;
  }
  // Convert annual capacity to number
  var trainees = parseInt(scenario.annualCapacity, 10);
  var uptake = computeFETPUptake(scenario);
  var effectiveEnrollment = trainees * uptake;
  // Total cost as per selected option (in rupees per month)
  var costMapping = { low: 27000, medium: 55000, high: 83000 };
  var totalCost = costMapping[scenario.totalCost];
  
  // QALY gain from selection
  var sel = document.getElementById("qalyFETPSelect");
  var qVal = (sel && sel.value === "low") ? 0.01 : (sel && sel.value === "high") ? 0.08 : 0.05;
  
  var monetizedBenefits = effectiveEnrollment * qVal * 50000;
  var netBenefit = monetizedBenefits - totalCost;
  document.getElementById("estimatedCostDisplay").innerHTML = "₹" + totalCost.toLocaleString();
  var container = document.getElementById("costsFETPResults");
  var econAdvice = (netBenefit < 0) ? "The programme may not be cost-effective. Consider revising features." :
                    (netBenefit < 50000) ? "Modest benefits. Some improvements could enhance cost-effectiveness." :
                                           "This configuration appears highly cost-effective.";
  container.innerHTML = "<div class='calculation-info'>" +
                        "<p><strong>Predicted Uptake:</strong> " + (uptake * 100).toFixed(2) + "%</p>" +
                        "<p><strong>Number of Trainees (Full Capacity):</strong> " + trainees + "</p>" +
                        "<p><strong>Effective Enrollment:</strong> " + Math.round(effectiveEnrollment) + "</p>" +
                        "<p><strong>Total Cost:</strong> ₹" + totalCost.toLocaleString() + " per month</p>" +
                        "<p><strong>Monetised Benefits:</strong> ₹" + monetizedBenefits.toLocaleString() + "</p>" +
                        "<p><strong>Net Benefit:</strong> ₹" + netBenefit.toLocaleString() + "</p>" +
                        "<p><em>Policy Recommendation:</em> " + econAdvice + "</p>" +
                        "</div>";
}

/* Render Cost-Benefit Analysis Chart */
function renderCostBenefitChart() {
  var scenario = buildFETPScenario();
  if (!scenario) return;
  var trainees = parseInt(scenario.annualCapacity, 10);
  var uptake = computeFETPUptake(scenario);
  var effectiveEnrollment = trainees * uptake;
  var costMapping = { low: 27000, medium: 55000, high: 83000 };
  var totalCost = costMapping[scenario.totalCost];
  var sel = document.getElementById("qalyFETPSelect");
  var qVal = (sel && sel.value === "low") ? 0.01 : (sel && sel.value === "high") ? 0.08 : 0.05;
  var monetizedBenefits = effectiveEnrollment * qVal * 50000;
  var netBenefit = monetizedBenefits - totalCost;
  var ctx = document.getElementById("costBenefitChart").getContext("2d");
  if (costBenefitChart) costBenefitChart.destroy();
  costBenefitChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Total Cost", "Monetised Benefits", "Net Benefit"],
      datasets: [{
        label: "₹",
        data: [totalCost, monetizedBenefits, netBenefit],
        backgroundColor: ["#e74c3c", "#27ae60", "#f1c40f"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000 },
      plugins: { 
        title: { display: true, text: "Cost-Benefit Analysis", font: { size: 16 } },
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

/* Scenario Saving & PDF Export */
var savedFETPScenarios = [];
function saveFETPScenario() {
  var sc = buildFETPScenario();
  if (!sc) { alert("Please select all inputs before saving a scenario."); return; }
  var uptake = computeFETPUptake(sc);
  var pct = uptake * 100;
  sc.uptake = pct.toFixed(2);
  // For simplicity, net benefit is approximated as (uptake percentage × 1000)
  var netB = (pct * 10).toFixed(2);
  sc.netBenefit = netB;
  sc.name = "Scenario " + (savedFETPScenarios.length + 1);
  savedFETPScenarios.push(sc);
  var tb = document.querySelector("#FETPScenarioTable tbody");
  var row = document.createElement("tr");
  row.innerHTML = "<td>" + sc.name + "</td>" +
                  "<td>" + sc.deliveryMethod + "</td>" +
                  "<td>" + sc.annualCapacity + "</td>" +
                  "<td>₹" + sc.stipendSupport + "</td>" +
                  "<td>" + sc.careerPathway + "</td>" +
                  "<td>" + sc.accreditation + "</td>" +
                  "<td>" + sc.totalCost + "</td>" +
                  "<td>" + sc.uptake + "%</td>" +
                  "<td>₹" + sc.netBenefit + "</td>";
  tb.appendChild(row);
  alert('"' + sc.name + '" saved successfully.');
}

function exportFETPComparison() {
  if (!savedFETPScenarios.length) { alert("No saved scenarios available."); return; }
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF({ unit: "mm", format: "a4" });
  var yPos = 15;
  doc.setFontSize(16);
  doc.text("Advanced FETP Scenarios Comparison", 105, yPos, { align: "center" });
  yPos += 10;
  savedFETPScenarios.forEach(function(sc, idx) {
    if (yPos + 60 > doc.internal.pageSize.getHeight() - 15) { doc.addPage(); yPos = 15; }
    doc.setFontSize(14);
    doc.text("Scenario " + (idx + 1) + ": " + sc.name, 15, yPos);
    yPos += 7;
    doc.setFontSize(12);
    doc.text("Delivery: " + sc.deliveryMethod, 15, yPos); yPos += 5;
    doc.text("Capacity: " + sc.annualCapacity, 15, yPos); yPos += 5;
    doc.text("Stipend: ₹" + sc.stipendSupport, 15, yPos); yPos += 5;
    doc.text("Career: " + sc.careerPathway, 15, yPos); yPos += 5;
    doc.text("Accreditation: " + sc.accreditation, 15, yPos); yPos += 5;
    doc.text("Cost: " + sc.totalCost, 15, yPos); yPos += 5;
    doc.text("Adoption: " + sc.uptake + "%, Net Benefit: ₹" + sc.netBenefit, 15, yPos);
    yPos += 10;
  });
  doc.save("AdvancedFETPScenarios_Comparison.pdf");
}

function exportIndividualScenario() {
  var input = prompt("Enter the scenario number to export:");
  var index = parseInt(input, 10);
  if (isNaN(index) || index < 1 || index > savedFETPScenarios.length) {
    alert("Invalid scenario number.");
    return;
  }
  var scenario = savedFETPScenarios[index - 1];
  var jsPDF = window.jspdf.jsPDF;
  var doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFontSize(16);
  doc.text("Scenario " + index + ": " + scenario.name, 15, 20);
  doc.setFontSize(12);
  doc.text("Delivery: " + scenario.deliveryMethod, 15, 30);
  doc.text("Capacity: " + scenario.annualCapacity, 15, 40);
  doc.text("Stipend: ₹" + scenario.stipendSupport, 15, 50);
  doc.text("Career: " + scenario.careerPathway, 15, 60);
  doc.text("Accreditation: " + scenario.accreditation, 15, 70);
  doc.text("Total Cost: " + scenario.totalCost, 15, 80);
  doc.text("Adoption Likelihood: " + scenario.uptake + "%", 15, 90);
  doc.text("Net Benefit: ₹" + scenario.netBenefit, 15, 100);
  doc.save("Scenario_" + index + ".pdf");
}

/* Toggle Cost Breakdown */
function toggleCostAccordion() {
  var elem = document.getElementById("detailedCostBreakdown");
  elem.style.display = (elem.style.display === "block") ? "none" : "block";
}

/* Toggle Benefits Explanation */
function toggleFETPBenefitsAnalysis() {
  var elem = document.getElementById("detailedFETPBenefitsAnalysis");
  elem.style.display = (elem.style.display === "block") ? "none" : "block";
}
