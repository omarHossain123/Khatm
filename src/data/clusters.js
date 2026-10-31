// Structure of the Quran following Sheikh Adnan's 12 clusters.
// The theme text for each cluster lives in the database ('cluster:<id>') so it
// can be edited from the site.

export const clusters = [
  { id: 0, label: 'The Opening', range: [1, 1] },
  { id: 1, label: 'First Cluster', range: [2, 9] },
  { id: 2, label: 'Second Cluster', range: [10, 13] },
  { id: 3, label: 'Third Cluster', range: [14, 16] },
  { id: 4, label: 'Fourth Cluster', range: [17, 27] },
  { id: 5, label: 'Fifth Cluster', range: [28, 32] },
  { id: 6, label: 'Sixth Cluster', range: [33, 39] },
  { id: 7, label: 'Seventh Cluster', range: [40, 46] },
  { id: 8, label: 'Eighth Cluster', range: [47, 49] },
  { id: 9, label: 'Ninth Cluster', range: [50, 57], mufassal: true },
  { id: 10, label: 'Tenth Cluster', range: [58, 66], mufassal: true },
  { id: 11, label: 'Eleventh Cluster', range: [67, 77], mufassal: true },
  {
    id: 12,
    label: 'Twelfth Cluster',
    range: [78, 114],
    mufassal: true,
    groups: [
      { label: 'The basic components needed for a faith to exist', range: [78, 80] },
      { label: 'Choices and all that pertains to them', range: [81, 85] },
      { label: "The Muslim's toolkit for dealing with life", range: [86, 92] },
      { label: 'Qisar al-Mufassal (قصار المفصل): the short, comprehensive surahs', range: [93, 114] },
    ],
  },
]

export const clusterForSurah = (n) => clusters.find((c) => n >= c.range[0] && n <= c.range[1])

export const groupForSurah = (n) =>
  clusterForSurah(n)?.groups?.find((g) => n >= g.range[0] && n <= g.range[1])
