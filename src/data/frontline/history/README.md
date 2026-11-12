# Monthly front line history — incomplete, deliberately

`UKR_Front_Line_FLC` layer 8 on OCHA's server holds 95 polylines covering
January to November 2026, one set per month, all assessed by ISW and AEI's
Critical Threats Project. That is the basis for comparing the front at two
dates with real geometry rather than two percentages.

`m01.json` is January, retrieved 12 November 2026 at the service's own
generalization (`maxAllowableOffset=0.02`, roughly 2.2 km). Its four features
(objectids 8–11) and their vertex counts match the full unfiltered listing
taken earlier, so it is corroborated by a second, independent query.

**February to November are not here, and must not be invented.**

Every filtered query against this layer currently returns the same four January
records, whatever is asked for:

| query | returned |
|---|---|
| `where=month_number=3` | objectids 8–11, month 1 |
| `where=month_number=5` | objectids 8–11, month 1 |
| `where=objectid>94` | objectids 8–11, month 1 |
| `resultOffset=60&resultRecordCount=12` | objectids 8–11, month 1 |

Changing the URL shape does not clear it, so this is upstream of the fetching
tool — the service, or a cache in front of it, has pinned one response for this
endpoint. The first unfiltered query of the session did return all 95 records
correctly, so the data is there; it is reachability that failed.

## To finish this

Retry later and check before trusting anything: a month's objectids must match
the full listing, and two different months must not return identical geometry.
That second check is what caught this — March came back byte-for-byte identical
to January, which is not something a moving front line does.
