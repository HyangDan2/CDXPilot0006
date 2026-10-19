# Layered puzzle rules — approved three-floor expansion

This document supersedes the initial proposal. Easy uses one floor, Normal two and Hard three, with ten stages per difficulty. Challenge mode is an independent timed option.

Upper tiles are offset by half a cell in each direction and centered over four lower tiles. Thickness, shadows and face colors replace numeric layer badges. A lower tile cannot be selected while an upper tile overlaps it. Removing tiles reveals lower tiles in place without gravity or relocation.

Connect exposed tiles with matching symbols on the same floor using at most two bends. The path runs on the selected floor, so tiles on that floor or above are obstacles; it may pass over lower-floor tiles. The help text explains this rule. Occupied footprint boundaries are also blocked: decorative gaps between tiles are not playable corridors.

Symbol counts range from 6–8 for Easy, 10–12 for Normal and 14–18 for Hard, limited by the number of available pairs on smaller boards. Every generated board retains a complete solution witness. Shuffling preserves surviving positions and each floor's symbol multiset.

Legacy classic/two-floor records are retained and displayed in settings, separately from the six new difficulty/Challenge combinations. Follow [ARCHITECTURE.md](ARCHITECTURE.md) for design contracts, [HARNESS.md](HARNESS.md) for verification procedures and [QA.md](QA.md) for actual results.
