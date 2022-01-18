# Reachable and Unsafe Set Visualization

## Overview

This project contains code for visualizing unsafe and reachable state sets
in a simple adapative cruise control scenario. The `src` folder contains the MATLAB code to generate the data, along with the `viz` folder which
can be served with any basic HTTP server.

![Visualization interface with parameters for distance from front car,
initial acceleration, and the number of seconds to project into the
future](interface.png)

This was originally made for a graduate course in
"Safe Autonomy for Cyber-Physical Systems."
The parameterized visualization interface is
meant to be friendly
and informative to those without much prior knowledge in the relevant areas
(differential equations, reachability theory, etc.),
and so it includes an expandable introduction and guide. The plan is to
improve and expand the interface then host it as a free
educational tool.

## Usage

The visualization can be hosted with any HTTP server, for example by
running `python -m http.server` in the `src/viz/` directory. Instructions
for using the interface are self-contained.

The data for the visualization is already included in this repo (about 300MB),
but it
can be regenerated with the MATLAB file at `src/data_generation.m`.
This script writes to CSV files in various folders which need to be
collated together by running `python csv_collater.py`
in the `src/viz/` directory.

## Attribution

The system dynamics for the adaptive cruise control scenario are based
on the benchmark in the paper ["Networked Cooperative Platoon of Vehicles for Testing Methods and Verification Tools" ](https://easychair.org/publications/open/3QLs) (Makhlouf and Kowalewski 2015).

Reachability calculations are done using
[the CORA toolbox](https://tumcps.github.io/CORA/) for MATLAB.

[The code](https://gitlab.com/goranf/ARCH-COMP/-/tree/master/2020/AFF/cora/code/CORA/ARCHcompetition) submitted by the CORA team for the 2020 [ARCH-COMP](https://cps-vo.org/group/ARCH/FriendlyCompetition) (for which the paper above
provides one of the benchmarks) was referenced while learning to
use CORA with systems defined by differential equations.

Visualizations are implemented with [D3.js](https://d3js.org/).
