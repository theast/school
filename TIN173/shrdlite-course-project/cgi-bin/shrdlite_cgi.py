#!/usr/bin/env python3

def main(state): 
    # This is just to make the impression of a large computation:
    import time
    time.sleep(1)

    intprt = interpret(**state)
    plan = planner(intprt, **state)
    return {'int': intprt,
            'plan': plan,
            }


def interpret(stacks, holding, arm, objects, utterance, parses):
    """
    This function returns a dummy interpretation involving two random objects
    """
    import random
    objs = [o for stk in stacks for o in stk]
    a = random.choice(objs)
    b = random.choice(objs)
    interpretation = [[
        {'pol': True, 'rel': "ontop", 'args': [a, "floor"]},
        {'pol': True, 'rel': "holding", 'args': [b]},
    ]]
    return interpretation


def planner(intprt, stacks, holding, arm, objects, utterance, parses):
    """
    This function craetes a dummy plan involving a random stack
    """
    import random
    while True:
        pickstack = random.randrange(len(stacks))
        if stacks[pickstack]:
            break
    plan = []

    # First move the arm to the selected stack
    if pickstack < arm:
        plan += ["Moving left"]
        plan += ["l"] * (arm - pickstack)
    elif pickstack > arm:
        plan += ["Moving right"]
        plan += ["r"] * (pickstack - arm)

    # Then pick up the object
    obj = stacks[pickstack][-1];
    plan += ["Picking up the " + objects[obj]['form'],
             "p"]

    if pickstack < len(stacks) - 1:
        # Then move to the rightmost stack
        plan += ["Moving as far right as possible"]
        plan += ["r"] * (len(stacks) - pickstack - 1)

        # Then move back
        plan += ["Moving back"]
        plan += ["l"] * (len(stacks) - pickstack - 1)

    # Finally put it down again
    plan += ["Dropping the " + objects[obj]['form'],
             "d"]

    return plan


######################################################################

if __name__ == '__main__':
    import cgi
    import json

    print('Content-type:text/plain')
    print()

    try:
        form = cgi.FieldStorage()
        jsondata = form.getfirst('data')
        state = json.loads(jsondata)
        result = main(state)
        print(json.dumps(result))

    except:
        import sys, traceback
        print(traceback.format_exc())
        sys.exit(1)
