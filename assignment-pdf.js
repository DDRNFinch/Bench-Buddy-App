
"use strict";

/**
 * Assignment PDF module.
 *
 * This file deliberately contains only assignment-PDF layout logic.
 * It relies on shared app helpers such as addHeader(), addFooter(),
 * detailBox(), sectionTitle(), getImage(), drawHighlightedText(), and
 * the assignment prompt/KSB helpers declared in app.js.
 */
async function downloadAssignmentPdf(assignment,evidence,profile){
  try{
    evidence=ensurePortfolioReflection(ensureCombinedEvidence(evidence,assignment));

    const {jsPDF}=window.jspdf;
    const pdf=new jsPDF({unit:"mm",format:"a4"});
    const margin=12;
    const contentW=186;
    const pageH=297;
    const bottom=278;
    const topics=reflectionTopics(assignment);
    const ksbs=assignmentKsbMap[String(assignment.id)]||[];

    const drawTextHeader=()=>{
      addHeader(pdf,"Assignment Evidence Pack",`Assignment ${assignment.id}`);
      pdf.setFont("helvetica","bold");
      pdf.setFontSize(12);
      pdf.setTextColor(35,42,51);
      const titleLines=pdf.splitTextToSize(assignment.title,contentW);
      pdf.text(titleLines,margin,39);
      return 39+(titleLines.length*5)+4;
    };

    const newTextPage=()=>{
      pdf.addPage();
      return drawTextHeader();
    };

    const ensure=(height,y)=>{
      return y+height>bottom ? newTextPage() : y;
    };

    // -----------------------------------------------------------------
    // PAGE 1 — six evidence spaces in a 3 x 2 table.
    // -----------------------------------------------------------------
    addHeader(pdf,"Assignment Evidence Sheet",`Assignment ${assignment.id}`);

    pdf.setFont("helvetica","bold");
    pdf.setFontSize(11);
    pdf.setTextColor(35,42,51);
    const titleLines=pdf.splitTextToSize(assignment.title,contentW);
    pdf.text(titleLines,margin,38);

    let gridY=38+(titleLines.length*5)+4;

    pdf.setFont("helvetica","normal");
    pdf.setFontSize(8);
    pdf.text(`Learner: ${profile.learner||"Not entered"}`,margin,gridY);
    pdf.text(
      `Date: ${evidence.date?pdfUkDate(evidence.date+"T12:00:00"):pdfUkDate()}`,
      118,
      gridY
    );
    gridY+=8;

    const evidenceItems=(evidence.evidenceItems||[])
      .filter(item=>item&&item.key)
      .slice(0,6);

    const columns=3;
    const rows=2;
    const gap=5;
    const cellW=(contentW-(gap*(columns-1)))/columns;
    const availableH=pageH-gridY-18;
    const cellH=(availableH-gap)/rows;

    for(let index=0; index<6; index++){
      const row=Math.floor(index/columns);
      const column=index%columns;
      const x=margin+(column*(cellW+gap));
      const y=gridY+(row*(cellH+gap));
      const item=evidenceItems[index];

      pdf.setDrawColor(190,197,205);
      pdf.setFillColor(248,249,251);
      pdf.roundedRect(x,y,cellW,cellH,3,3,"FD");

      pdf.setFont("helvetica","bold");
      pdf.setFontSize(8);
      pdf.setTextColor(35,42,51);

      const slotLabel=item?.name||`Evidence ${index+1}`;
      const labelLines=pdf.splitTextToSize(`${index+1}. ${slotLabel}`,cellW-8);
      pdf.text(labelLines,x+4,y+6);

      const contentTop=y+15;
      const contentHeight=cellH-21;

      if(!item){
        pdf.setFont("helvetica","normal");
        pdf.setTextColor(140,145,150);
        pdf.text("No evidence uploaded",x+4,contentTop+10);
        continue;
      }

      if(item.isImage){
        const image=await getImage(item.key);
        if(image){
          const props=pdf.getImageProperties(image);
          const maxW=cellW-8;
          const maxH=contentHeight-3;
          const ratio=Math.min(maxW/props.width,maxH/props.height);
          const imageW=props.width*ratio;
          const imageH=props.height*ratio;
          pdf.addImage(
            image,
            "JPEG",
            x+((cellW-imageW)/2),
            contentTop+((contentHeight-imageH)/2),
            imageW,
            imageH
          );
        }else{
          pdf.setFont("helvetica","normal");
          pdf.text("Image unavailable",x+4,contentTop+10);
        }
      }else{
        pdf.setFont("helvetica","bold");
        pdf.setFontSize(9);
        pdf.text("Uploaded file",x+4,contentTop+8);
        pdf.setFont("helvetica","normal");
        pdf.setFontSize(8);
        const fileDetails=pdf.splitTextToSize(
          `${item.name||"Supporting file"}\n${item.type||"File"}`,
          cellW-8
        );
        pdf.text(fileDetails,x+4,contentTop+16);
      }
    }

    // -----------------------------------------------------------------
    // PAGE 2+ — all written evidence.
    // -----------------------------------------------------------------
    let y=newTextPage();

    y=detailBox(pdf,[
      ["Learner",profile.learner||"Not entered"],
      ["Date",evidence.date?pdfUkDate(evidence.date+"T12:00:00"):pdfUkDate()],
      ["Course",profile.course||"Carpentry and Joinery Level 2"],
      ["Employer",profile.employer||"Not entered"]
    ],y);

    y=ensure(22,y);
    y=sectionTitle(pdf,"Learner Activity Statement",y);
    pdf.setFontSize(8.5);
    y=drawHighlightedText(
      pdf,
      evidence.description||"",
      assignmentEvidencePrompts(assignment),
      margin,
      y,
      contentW,
      4.2,
      newTextPage
    )+7;

    y=ensure(22,y);
    y=sectionTitle(pdf,"Knowledge & Behaviour Reflection",y);
    pdf.setFontSize(8.5);
    y=drawHighlightedText(
      pdf,
      evidence.reflection||"",
      combinedReflectionPrompts(assignment),
      margin,
      y,
      contentW,
      4.2,
      newTextPage
    )+8;

    y=ensure(32,y);
    y=sectionTitle(pdf,"KSBs Evidenced — Assessor Reference",y);

    const knowledge=ksbs.filter(item=>item.startsWith("K"));
    const skills=ksbs.filter(item=>item.startsWith("S"));
    const behaviours=ksbs.filter(item=>item.startsWith("B"));

    pdf.setFontSize(8.5);
    [
      ["Knowledge",knowledge],
      ["Skills",skills],
      ["Behaviours",behaviours]
    ].forEach(([label,items])=>{
      if(!items.length)return;
      pdf.setFont("helvetica","bold");
      pdf.text(`${label}:`,margin,y);
      pdf.setFont("helvetica","normal");
      pdf.text(items.join(" • "),margin+27,y);
      y+=6;
    });

    const metPrompts=[
      ...assignmentEvidencePrompts(assignment),
      ...combinedReflectionPrompts(assignment)
    ].filter(prompt=>
      promptMatchedWithAliases(
        `${evidence.description||""} ${evidence.reflection||""}`,
        prompt.term
      )
    );

    if(metPrompts.length){
      y+=3;
      pdf.setFont("helvetica","bold");
      pdf.text("Prompts met:",margin,y);
      y+=5;
      pdf.text(
        pdf.splitTextToSize(
          [...new Set(metPrompts.map(prompt=>prompt.label))].join(" • "),
          contentW
        ),
        margin,
        y
      );
      y+=11;
    }

    y=ensure(38,y);
    y=sectionTitle(pdf,"Learner Declaration",y);
    pdf.setFont("helvetica","normal");
    pdf.setFontSize(8);
    pdf.text(
      pdf.splitTextToSize(
        "I confirm that this evidence is my own work and accurately reflects the activities I completed during my apprenticeship.",
        contentW
      ),
      margin,
      y
    );
    y+=12;

    if(profile.signature){
      pdf.addImage(profile.signature,"PNG",margin,y,45,14);
      y+=17;
    }

    pdf.setFont("helvetica","bold");
    pdf.text(`Signed by: ${profile.learner||"Learner"}`,margin,y);
    pdf.setFont("helvetica","normal");
    pdf.text(`Date: ${pdfUkDate()}`,135,y);

    // Apply one consistent footer after every page has been created.
    addFooter(pdf);

    const filename=`Assignment-${assignment.id}-${safe(assignment.title)}.pdf`;
    return {
      blob:pdf.output("blob"),
      filename
    };
  }catch(error){
    console.error("Assignment PDF error:",error);
    alert("The assignment PDF could not be created. Your evidence is still saved.");
    return null;
  }
}
