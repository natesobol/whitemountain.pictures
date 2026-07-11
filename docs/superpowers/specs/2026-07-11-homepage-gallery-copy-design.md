# Homepage Gallery Copy Design

Date: July 11, 2026

## Outcome

The homepage will welcome visitors into a quiet photography gallery. Its visible language will speak about photographs, place, weather, light, and wandering through the work. It will not describe publishing systems, review workflows, camera equipment, indexing, or search infrastructure.

The voice is a patient mountain guide. It is warm, plainspoken, and lightly reflective. The photographs remain the strongest presence.

## Scope

This pass covers all visitor facing homepage copy, including the document description, hero, year and season controls, result actions, empty and error states, explanatory sections, and the final gallery action.

Internal variable names, data fields, build reports, tests, and deployment language may remain technical when visitors cannot see them.

## Final Copy

### Document description

`White Mountains photographs by Nathan Sobol, made along the trails, forests, ridges, and summits of New Hampshire.`

### Hero

Kicker:

`Photographs by Nathan Sobol · New Hampshire`

Heading:

`White Mountains Pictures`

Lead:

`Walk slowly through trails, summits, forest light, and changing weather across New Hampshire’s White Mountains.`

Primary action:

`Begin with 2026`

Secondary action:

`Begin with 2025`

### Gallery controls

Keep the Year and Season controls.

Remove the Metadata control and its review options from the homepage.

Use these labels:

| Element | Final text |
| --- | --- |
| Year default | `All years` |
| Season default | `All seasons` |
| Reset action | `Clear filters` |
| Result action | `Show more photographs` |
| Empty state | `No photographs match these choices.` |
| Empty state action | `Clear filters` |
| Error state | `The gallery could not open the full selection. The photographs already here are still available.` |
| Retry action | `Try again` |

The visible result count may continue to use direct wording such as `Showing 24 of 356 photographs`.

### First explanatory section

Kicker:

`A quiet way through`

Heading:

`There is no right order here.`

Body:

`Choose a year or season, or begin with the photograph that holds your attention.`

### Second explanatory section

Kicker:

`Keep walking`

Heading:

`One photograph leads to another.`

Body:

`Open any image for a closer view, then continue by place, outing, year, or the neighboring frame.`

Action:

`View the full gallery`

## Language Removed From the Homepage

The generated homepage must not present any of these terms or ideas to visitors:

1. Field archive
2. Metadata rich
3. Metadata filters or review states
4. Safe location context
5. Camera or lens data
6. Editorial metadata gates
7. Pending review
8. Search engine readiness
9. Search engine sitemaps
10. Records or publication machinery

The word `gallery` replaces `archive` in homepage actions and descriptive copy. Existing link destinations do not change.

## Behavior

Removing the Metadata control must not remove photographs from the homepage or disturb the Year and Season filters. Existing keyboard support, announcements, reset behavior, progressive loading, and fallback states remain available.

No new animation, component, dependency, route, or visual asset is part of this copy pass.

## Verification

Automated distribution checks will confirm that the generated homepage contains every approved phrase and none of the banned visitor facing phrases.

Existing tests must continue to cover filtering, reset behavior, result counts, progressive loading, empty states, and error recovery after the Metadata control is removed from the homepage.

The final rendered homepage will be reviewed at desktop and mobile widths to confirm that the shorter copy preserves the intended spacing and hierarchy.
