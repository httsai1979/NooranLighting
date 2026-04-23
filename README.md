ACOfusion 10mm Smart Configurator
Final Technical Requirement Document (Integrated Version)

1. Data Architecture (Strict Source Control)
1.1 Authorised Data Sources (Non-negotiable)

All system logic MUST strictly rely on the following sources.
No inferred, estimated, or external data is allowed.

Google Sheet ID
1CP0xxEZGIOr7Se-aGzkgrDli774U1FkXNhs7GeYiqx0

1.2 Data Mapping
Sheet: S10_Magnetic_lamp

Used for all luminaire-related logic.

Field Usage
Model Product identification
Price BOM calculation
Power (F column) Mandatory numeric conversion for electrical calculation
Specifications Used for UI spec modal (ⓘ)
Photo Product card display

Critical Rule

Power must be parsed as numeric
This is the only valid input for load calculation
Sheet: S10_Track&accessory

Used for ALL non-luminaire components:

Tracks (Profiles)
Connectors
Power Supply Units (PSU)
Mounting Accessories
End Caps
Suspension Kits
1.3 Image Loading Standard
<https://drive.google.com/thumbnail?id=[ID]&sz=w1000>

Fallback rule:

If image fails → show grey placeholder
Broken image icons are strictly forbidden
2. System Logic (Expert Rule Engine)
2.1 Stage 1 — Mounting Selection

System must enforce model prefix filtering:

Mounting Type Allowed Models
Surface / Pendant G-TL-A
Recessed G-TL-B, G-TL-C
Trimless G-TL-D

Rule

Mixing track types is NOT allowed
2.2 Stage 2 — Topology Logic
Layout Type Required Logic
Straight No corner components
L-Shape 1 Mechanical Corner + 1 Electrical Connector
T-Shape Must include Polarity Changer
Rectangle Must include Polarity Changer

Critical Safety Constraint

T / Rectangle layouts MUST trigger polarity logic
→ Prevent phase short-circuit risk
2.3 Stage 3 — Electrical Load Engine
Core Formula

Total Load:

Total Load = Sum(All Luminaire Power)

Safety Margin (N+1 Rule):

Required Capacity = Total Load + Max(Single Luminaire Power)
PSU Auto Selection Logic
Condition Action
≤100W Select 100W PSU
100–200W Select 200W PSU
>200W Auto stack PSU units
Overload Protection
If required capacity exceeds system capability:
Show RED warning
Block progression
1. Auto BOM Generation Engine

System must auto-generate full Bill of Materials.

3.1 Track Profiles
Quantity = CEILING(Total Metres / 2)

(2m per track)

3.2 Mandatory Components
Component Rule
Power Feed Always add 1 × Live End (-ZJDY)
End Caps Always add 2 × (-SM)
3.3 Connectors
Straight Connectors = Track Count - 1 - Corner Count
3.4 Mounting Hardware
Surface
Add Fixing Clips (-MZKK)
Density proportional to length
Pendant

Rules:

Base suspension allocation by length
Additional suspension required at:
Every corner
Every junction (L / T / X)
3.5 Topology Safety Injection
Condition Mandatory Addition
T / Rectangle Polarity Changer
4. UX / UI Specification (UK Standard)
4.1 Language

Strict British English:

Metres
Luminaires
Synchronising
Honoured
4.2 Layout Behaviour
Desktop
Left (65%) → Configuration Wizard
Right (35%) → Sticky BOM + Power Summary
Mobile
Single column flow
BOM hidden in bottom drawer or final step
4.3 Product Cards

Each luminaire must include:

Image
Model
Price
Add button
ⓘ Spec button
4.4 Spec Modal (ⓘ)

Must display:

Size
CRI
Voltage
Colour Temperature
Any other available spec fields
5. Safety & Poka-Yoke System
5.1 Empty State Protection
Cannot export without luminaires
5.2 Electrical Protection
Overload → hard stop + red warning
5.3 Structural Protection
Pendant systems must enforce:
Additional suspension at stress points
5.4 Data Integrity
Only sheet data allowed
No fallback assumptions
6. Output System (PDF Export)
6.1 Layout
A4 Landscape
Clean table format
Navigation removed
6.2 Content Requirements

Must include:

Brand Logo
Product thumbnails
Categorised BOM sections
Total wattage summary
PSU configuration
Validity disclaimer
6.3 Visual Structure

Sections:

Luminaires
Tracks
Connectors
Power Supply
Accessories
7. System Behaviour Summary (Core Principles)

This configurator must behave like:

A lighting engineer, not a shopping cart

Key characteristics:

Rule-driven (not user guesswork)
Error-preventing (not error-reporting)
Auto-completing (not requiring manual assembly)
Electrically safe by default
