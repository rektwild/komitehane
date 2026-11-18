# Academic rules and calculations

`ACADEMIC_CURRENT_YEAR_START` explicitly chooses the academic year; no calendar
heuristic or previous-year fallback is used. A scheme is annual, fall or spring,
and belongs to either committee or midterm. A publishable version has one
final, 1–10 correctly ordered intermediate components of the appropriate type,
positive weights summing exactly to 100.00, a target between 0 and 100, and a
manually checked HTTPS source with verification time. A correction is a new
version; effective dates are not inferred.

The same integer-hundredths calculation engine is used by the API and the
calculator adapter. Minimum final is rounded upward to two decimal places for
display. The result describes a weighted-average target, not official passage
or a final exemption. Final-score thresholds, exemptions, resits, curves,
attendance and hybrid systems are not represented. User changes remain local;
overrides in the API yield `CUSTOM`, and cannot be labelled official by the
caller. Old rule versions require an explicit historical request.
